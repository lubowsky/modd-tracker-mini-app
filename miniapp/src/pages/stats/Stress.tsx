// src/pages/stats/Stress.tsx
import React from "react";
import { Header } from "../../components/Header";
import { ChartContainer } from "../../components/ChartContainer";
import { Button } from "../../components/Button";
import { useEntriesStore } from "../../store/entriesStore";
import BackButton from "../../components/BackButton";
import { PeriodSelector } from "../../components/PeriodSelector";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";

type Period = 7 | 14 | 30 | "all";
type Tab = "charts" | "triggers" | "patterns";

const StressDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.hasNotes) return null;

  return (
    <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12">
      📝
    </text>
  );
};

const StressPage: React.FC = () => {
  const entries = useEntriesStore((s) => s.entries);
  const loading = useEntriesStore((s) => s.loading);

  const [period, setPeriod] = React.useState<Period>(7);
  const [tab, setTab] = React.useState<Tab>("charts");
  const [selectedTrigger, setSelectedTrigger] = React.useState<string | null>(null);

  /** 1. Нормализация записей с уровнем стресса */
  const stressEntries = React.useMemo(() => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    
    return safeEntries
      .filter((e) => e?.stressLevel !== undefined && e.stressLevel !== null)
      .sort(
        (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)
      );
  }, [entries]);

  /** 2. Фильтрация по периоду */
  const filteredEntries = React.useMemo(() => {
    if (period === "all") return stressEntries;

    const from = new Date();
    from.setDate(from.getDate() - period);

    return stressEntries.filter(
      (e) => e?.timestamp && new Date(e.timestamp) >= from
    );
  }, [stressEntries, period]);

  /** 3. Данные для графиков стресса */
  const stressData = React.useMemo(() => {
    return filteredEntries.map((e) => ({
      date: new Date(e.timestamp).toLocaleDateString(),
      fullDate: new Date(e.timestamp),
      stressLevel: e.stressLevel ?? 0,
      physicalScore: e.overallPhysical ?? 0,
      mentalScore: e.overallMental ?? 0,
      timeOfDay: e.timeOfDay,
      hasNotes: Boolean(e.notes && e.notes.trim().length > 0),
      notes: e.notes,
      triggersCount: e.triggers?.length || 0,
      hasTriggers: Boolean(e.triggers && e.triggers.length > 0),
      activitiesCount: e.activities?.length || 0,
    }));
  }, [filteredEntries]);

  /** 4. Статистика триггеров стресса */
  const triggerStats = React.useMemo(() => {
    const triggerMap = new Map<string, { 
      frequency: number;
      totalStress: number;
      entries: any[];
      dates: Date[];
    }>();
    
    filteredEntries.forEach(entry => {
      entry.triggers?.forEach(trigger => {
        if (!trigger) return;
        
        const existing = triggerMap.get(trigger);
        if (existing) {
          existing.frequency += 1;
          existing.totalStress += entry.stressLevel || 0;
          existing.entries.push(entry);
          existing.dates.push(new Date(entry.timestamp));
        } else {
          triggerMap.set(trigger, {
            frequency: 1,
            totalStress: entry.stressLevel || 0,
            entries: [entry],
            dates: [new Date(entry.timestamp)]
          });
        }
      });
    });

    return Array.from(triggerMap.entries())
      .map(([name, data]) => ({
        name,
        frequency: data.frequency,
        avgStress: data.totalStress / data.frequency,
        entries: data.entries,
        dates: data.dates,
        lastOccurrence: data.dates.length > 0 
          ? Math.max(...data.dates.map(d => d.getTime()))
          : 0,
        percentage: (data.frequency / filteredEntries.length) * 100
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }, [filteredEntries]);

  /** 5. Статистика по времени суток */
  const timeOfDayStats = React.useMemo(() => {
    const timeMap = new Map<string, { 
      count: number;
      totalStress: number;
      entries: any[];
    }>();
    
    filteredEntries.forEach(entry => {
      const time = entry.timeOfDay || 'unknown';
      const existing = timeMap.get(time);
      
      if (existing) {
        existing.count += 1;
        existing.totalStress += entry.stressLevel || 0;
        existing.entries.push(entry);
      } else {
        timeMap.set(time, {
          count: 1,
          totalStress: entry.stressLevel || 0,
          entries: [entry]
        });
      }
    });

    return Array.from(timeMap.entries())
      .map(([time, data]) => ({
        time: time === 'morning' ? 'Утро' :
              time === 'afternoon' ? 'День' :
              time === 'evening' ? 'Вечер' :
              time === 'night' ? 'Ночь' : 'Не указано',
        originalTime: time,
        count: data.count,
        avgStress: data.totalStress / data.count,
        percentage: (data.count / filteredEntries.length) * 100
      }))
      .sort((a, b) => {
        const order = ['Утро', 'День', 'Вечер', 'Ночь', 'Не указано'];
        return order.indexOf(a.time) - order.indexOf(b.time);
      });
  }, [filteredEntries]);

  /** 6. Данные для графика корреляции стресса и физического состояния */
  const correlationData = React.useMemo(() => {
    return filteredEntries
      .filter(e => e.stressLevel !== undefined && e.overallPhysical !== undefined)
      .map(entry => ({
        stress: entry.stressLevel || 0,
        physical: entry.overallPhysical || 0,
        mental: entry.overallMental || 0,
        date: new Date(entry.timestamp).toLocaleDateString(),
        hasTriggers: Boolean(entry.triggers && entry.triggers.length > 0),
        triggersCount: entry.triggers?.length || 0,
        size: 10 + (entry.triggers?.length || 0) * 5 // Размер точки зависит от количества триггеров
      }));
  }, [filteredEntries]);

  /** 7. Данные для графика конкретного триггера */
  const selectedTriggerData = React.useMemo(() => {
    if (!selectedTrigger) return [];
    
    return filteredEntries
      .filter(entry => entry.triggers?.includes(selectedTrigger))
      .map(entry => ({
        date: new Date(entry.timestamp).toLocaleDateString(),
        stressLevel: entry.stressLevel ?? 0,
        physicalScore: entry.overallPhysical ?? 0,
        mentalScore: entry.overallMental ?? 0,
        timeOfDay: entry.timeOfDay,
        hasNotes: Boolean(entry.notes && entry.notes.trim().length > 0),
        notes: entry.notes,
        otherTriggers: entry.triggers?.filter(t => t !== selectedTrigger) || []
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries, selectedTrigger]);

  /** 8. Цвет для уровней стресса */
  const getStressColor = (stressLevel: number): string => {
    if (stressLevel >= 8) return '#FF5252'; // Высокий - красный
    if (stressLevel >= 6) return '#FF9800'; // Средне-высокий - оранжевый
    if (stressLevel >= 4) return '#FFC107'; // Средний - желтый
    if (stressLevel >= 2) return '#4CAF50'; // Низкий - зеленый
    return '#8BC34A'; // Очень низкий - светло-зеленый
  };

  /** 9. Общая статистика */
  const overallStats = React.useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        avgStress: 0,
        maxStress: 0,
        minStress: 0,
        daysWithHighStress: 0,
        daysWithTriggers: 0,
        totalTriggers: 0,
        mostCommonTrigger: null as string | null
      };
    }
    
    const stressLevels = filteredEntries.map(e => e.stressLevel || 0);
    const avgStress = stressLevels.reduce((sum, val) => sum + val, 0) / stressLevels.length;
    const maxStress = Math.max(...stressLevels);
    const minStress = Math.min(...stressLevels);
    
    const daysWithHighStress = filteredEntries.filter(e => (e.stressLevel || 0) >= 7).length;
    const daysWithTriggers = filteredEntries.filter(e => e.triggers && e.triggers.length > 0).length;
    const totalTriggers = filteredEntries.reduce((sum, e) => sum + (e.triggers?.length || 0), 0);
    
    const mostCommonTrigger = triggerStats.length > 0 ? triggerStats[0].name : null;
    
    return {
      avgStress,
      maxStress,
      minStress,
      daysWithHighStress,
      percentageHighStress: (daysWithHighStress / filteredEntries.length) * 100,
      daysWithTriggers,
      percentageWithTriggers: (daysWithTriggers / filteredEntries.length) * 100,
      totalTriggers,
      mostCommonTrigger
    };
  }, [filteredEntries, triggerStats]);

  /** 10. Тренды стресса по дням недели */
  const dayOfWeekStats = React.useMemo(() => {
    const dayMap = new Map<string, { count: number; totalStress: number }>();
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    filteredEntries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const day = days[date.getDay()];
      const existing = dayMap.get(day);
      
      if (existing) {
        existing.count += 1;
        existing.totalStress += entry.stressLevel || 0;
      } else {
        dayMap.set(day, {
          count: 1,
          totalStress: entry.stressLevel || 0
        });
      }
    });
    
    return days.map(day => {
      const data = dayMap.get(day);
      return {
        day,
        count: data?.count || 0,
        avgStress: data ? data.totalStress / data.count : 0
      };
    });
  }, [filteredEntries]);

  return (
    <>
      <Header title="Уровень стресса" />

      <div style={{ padding: 16 }}>
        <BackButton />
        <PeriodSelector period={period} onPeriodChange={setPeriod} />

        {/* Вкладки */}
        <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            type={tab === "charts" ? "primary" : "secondary"}
            onClick={() => setTab("charts")}
          >
            Графики
          </Button>
          <Button
            type={tab === "triggers" ? "primary" : "secondary"}
            onClick={() => setTab("triggers")}
          >
            Триггеры
          </Button>
          <Button
            type={tab === "patterns" ? "primary" : "secondary"}
            onClick={() => setTab("patterns")}
          >
            Паттерны
          </Button>
        </div>

        {tab === "charts" && (
          <>
            {/* График уровня стресса */}
            <ChartContainer title="Уровень стресса по дням">
              {loading ? (
                <p>Загрузка...</p>
              ) : filteredEntries.length === 0 ? (
                <p>Нет данных об уровне стресса за выбранный период</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'stressLevel') return [`${value}/10`, 'Уровень стресса'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="stressLevel"
                      stroke="#FF5252"
                      strokeWidth={3}
                      dot={<StressDot />}
                      name="Стресс"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* График корреляции стресса и физического состояния */}
            <ChartContainer title="Корреляция стресса и физического состояния">
              {loading ? (
                <p>Загрузка...</p>
              ) : correlationData.length === 0 ? (
                <p>Нет данных для анализа корреляции</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="stress" 
                      name="Стресс" 
                      domain={[0, 10]}
                      label={{ value: 'Уровень стресса', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="physical" 
                      name="Физическое состояние" 
                      domain={[0, 10]}
                      label={{ value: 'Физическое состояние', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis type="number" dataKey="size" range={[50, 300]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'stress') return [`${value}/10`, 'Стресс'];
                        if (name === 'physical') return [`${value}/10`, 'Физическое состояние'];
                        if (name === 'mental') return [`${value}/10`, 'Психическое состояние'];
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `Дата: ${payload[0].payload.date}`;
                        }
                        return '';
                      }}
                    />
                    <Scatter
                      name="Записи"
                      data={correlationData}
                      fill="#8884d8"
                      shape="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* График стресса по времени суток */}
            <ChartContainer title="Средний стресс по времени суток">
              {loading ? (
                <p>Загрузка...</p>
              ) : timeOfDayStats.length === 0 ? (
                <p>Нет данных по времени суток</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeOfDayStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'avgStress') return [`${Number(value).toFixed(1)}/10`, 'Средний стресс'];
                        if (name === 'count') return [value, 'Количество записей'];
                        return [value, name];
                      }}
                    />
                    <Bar 
                      dataKey="avgStress" 
                      fill="#FF9800" 
                      radius={[4, 4, 0, 0]}
                      name="Средний стресс"
                    >
                      {timeOfDayStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStressColor(entry.avgStress)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>
          </>
        )}

        {tab === "triggers" && (
          <>
            {selectedTrigger ? (
              <>
                <Button 
                  type="secondary" 
                  onClick={() => setSelectedTrigger(null)}
                  style={{ marginBottom: 16 }}
                >
                  ← Назад ко всем триггерам
                </Button>

                <ChartContainer title={`Триггер: ${selectedTrigger}`}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: 16,
                    gap: 12
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#FF5252'
                    }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {selectedTrigger}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {triggerStats.find(t => t.name === selectedTrigger)?.frequency || 0} упоминаний
                        {triggerStats.find(t => t.name === selectedTrigger) && 
                          ` • Средний стресс: ${triggerStats.find(t => t.name === selectedTrigger)!.avgStress.toFixed(1)}/10`
                        }
                      </div>
                    </div>
                  </div>

                  {selectedTriggerData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={selectedTriggerData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'stressLevel') return [`${value}/10`, 'Уровень стресса'];
                              if (name === 'physicalScore') return [`${value}/10`, 'Физическое состояние'];
                              if (name === 'mentalScore') return [`${value}/10`, 'Психическое состояние'];
                              return [value, name];
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="stressLevel"
                            stroke="#FF5252"
                            strokeWidth={3}
                            name="Уровень стресса"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Детали записей с этим триггером */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: 12,
                          color: '#444'
                        }}>
                          Записи с триггером "{selectedTrigger}"
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 12,
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {selectedTriggerData.map((entry, index) => {
                            const originalEntry = filteredEntries.find(e => 
                              new Date(e.timestamp).toLocaleDateString() === entry.date &&
                              e.triggers?.includes(selectedTrigger)
                            );
                            
                            return (
                              <div
                                key={index}
                                style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  background: '#f9f9f9',
                                  borderLeft: `4px solid #FF5252`
                                }}
                              >
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#666',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginBottom: '6px'
                                }}>
                                  <span>
                                    {entry.date} • {entry.timeOfDay}
                                  </span>
                                  <span style={{ fontWeight: 'bold', color: '#FF5252' }}>
                                    Стресс: {entry.stressLevel}/10
                                  </span>
                                </div>
                                
                                {originalEntry && (
                                  <>
                                    <div style={{ 
                                      display: 'flex', 
                                      gap: '12px', 
                                      fontSize: '12px',
                                      color: '#666',
                                      marginBottom: '8px'
                                    }}>
                                      <span>💪 {originalEntry.overallPhysical ?? '–'}/10</span>
                                      <span>🧠 {originalEntry.overallMental ?? '–'}/10</span>
                                    </div>
                                    
                                    {/* Другие триггеры */}
                                    {entry.otherTriggers.length > 0 && (
                                      <div style={{ marginBottom: '8px' }}>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                          Также присутствовали:
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                          {entry.otherTriggers.map((trigger, idx) => (
                                            <span
                                              key={idx}
                                              style={{
                                                padding: '2px 6px',
                                                borderRadius: '10px',
                                                background: '#e0e0e0',
                                                color: '#666',
                                                fontSize: '11px'
                                              }}
                                            >
                                              {trigger}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {originalEntry.thoughts && (
                                      <div style={{ 
                                        margin: '8px 0', 
                                        fontStyle: 'italic',
                                        fontSize: '14px',
                                        padding: '8px',
                                        background: '#fff',
                                        borderRadius: '4px'
                                      }}>
                                        "{originalEntry.thoughts}"
                                      </div>
                                    )}
                                    
                                    {originalEntry.notes && (
                                      <div style={{ 
                                        marginTop: '8px', 
                                        fontSize: '12px', 
                                        color: '#777',
                                        padding: '8px',
                                        background: 'white',
                                        borderRadius: '4px'
                                      }}>
                                        📝 {originalEntry.notes}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>Нет данных для выбранного триггера</p>
                  )}
                </ChartContainer>
              </>
            ) : (
              <>
                <ChartContainer title="Триггеры стресса">
                  {loading ? (
                    <p>Загрузка...</p>
                  ) : triggerStats.length === 0 ? (
                    <div>
                      <p>Нет данных о триггерах стресса за выбранный период</p>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Триггеры добавляются в записях настроения в разделе "Триггеры"
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Топ триггеров */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: 12,
                          color: '#444'
                        }}>
                          Самые частые триггеры
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {triggerStats.slice(0, 10).map((stat, index) => (
                            <div
                              key={stat.name}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                background: '#fff',
                                border: '1px solid #eee',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onClick={() => setSelectedTrigger(stat.name)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(4px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: getStressColor(stat.avgStress)
                                  }} />
                                  <div>
                                    <span style={{ fontWeight: 'bold' }}>
                                      {index + 1}. {stat.name}
                                    </span>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                      Средний стресс: <span style={{ fontWeight: 'bold', color: '#FF5252' }}>
                                        {stat.avgStress.toFixed(1)}/10
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: 16, fontSize: '12px' }}>
                                  <span style={{ color: '#666' }}>
                                    {stat.frequency} раз
                                  </span>
                                  <span style={{ 
                                    fontWeight: 'bold',
                                    color: '#FF5252'
                                  }}>
                                    {stat.percentage.toFixed(1)}% дней
                                  </span>
                                </div>
                              </div>
                              
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#888',
                                marginTop: '6px',
                                fontStyle: 'italic'
                              }}>
                                Последний раз: {new Date(stat.lastOccurrence).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Общая статистика триггеров */}
                      <div style={{ 
                        padding: '16px', 
                        background: '#f8f9fa', 
                        borderRadius: '8px'
                      }}>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#666', 
                          marginBottom: '12px'
                        }}>
                          📊 Статистика триггеров
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a90e2' }}>
                              {overallStats.daysWithTriggers}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>дней с триггерами</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8bc34a' }}>
                              {triggerStats.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>уникальных триггеров</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                              {overallStats.totalTriggers}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>всего упоминаний</div>
                          </div>
                        </div>
                        {overallStats.mostCommonTrigger && (
                          <div style={{ 
                            marginTop: '12px', 
                            padding: '8px',
                            background: 'white',
                            borderRadius: '6px',
                            fontSize: '13px'
                          }}>
                            🎯 <strong>Самый частый триггер:</strong> {overallStats.mostCommonTrigger} 
                            ({triggerStats[0].frequency} раз)
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </ChartContainer>
              </>
            )}
          </>
        )}

        {tab === "patterns" && (
          <ChartContainer title="Паттерны стресса">
            {loading ? (
              <p>Загрузка...</p>
            ) : filteredEntries.length === 0 ? (
              <p>Нет данных за выбранный период</p>
            ) : (
              <>
                {/* Карточки статистики */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Средний стресс</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.avgStress.toFixed(1)}/10
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      за {filteredEntries.length} {filteredEntries.length === 1 ? 'день' : 'дней'}
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Дней с высоким стрессом</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.daysWithHighStress}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      {overallStats?.percentageHighStress && overallStats?.percentageHighStress.toFixed(1)}% от периода
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Максимальный стресс</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.maxStress}/10
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      Пиковое значение
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Минимальный стресс</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.minStress}/10
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      Самое спокойное время
                    </div>
                  </div>
                </div>

                {/* График стресса по дням недели */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#444'
                  }}>
                    Стресс по дням недели
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dayOfWeekStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'avgStress') return [`${Number(value).toFixed(1)}/10`, 'Средний стресс'];
                          if (name === 'count') return [value, 'Количество записей'];
                          return [value, name];
                        }}
                      />
                      <Bar 
                        dataKey="avgStress" 
                        radius={[4, 4, 0, 0]}
                        name="Средний стресс"
                      >
                        {dayOfWeekStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getStressColor(entry.avgStress)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Распределение по времени суток */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#444'
                  }}>
                    Распределение по времени суток
                  </div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px'
                  }}>
                    {timeOfDayStats.map((timeStat) => (
                      <div
                        key={timeStat.originalTime}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: '#f5f5f5',
                          borderLeft: `4px solid ${getStressColor(timeStat.avgStress)}`
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {timeStat.time}
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: getStressColor(timeStat.avgStress) }}>
                          {timeStat.avgStress.toFixed(1)}/10
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {timeStat.count} записей • {timeStat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Последние записи с высоким стрессом */}
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#444'
                  }}>
                    Последние записи с высоким стрессом (≥7/10)
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {filteredEntries
                      .filter(e => (e.stressLevel || 0) >= 7)
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 10)
                      .map((entry) => (
                        <div
                          key={String(entry._id)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: '#f9f9f9',
                            borderLeft: `4px solid ${getStressColor(entry.stressLevel || 0)}`
                          }}
                        >
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '6px'
                          }}>
                            <span>{new Date(entry.timestamp).toLocaleDateString('ru-RU')}</span>
                            <span style={{ textTransform: 'capitalize' }}>{entry.timeOfDay}</span>
                          </div>
                          
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px', 
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              fontWeight: 'bold', 
                              color: getStressColor(entry.stressLevel || 0),
                              fontSize: '16px'
                            }}>
                              ⚡ {entry.stressLevel}/10
                            </div>
                            <div style={{ color: '#FF6B6B' }}>
                              💪 {entry.overallPhysical ?? '–'}/10
                            </div>
                            <div style={{ color: '#42A5F5' }}>
                              🧠 {entry.overallMental ?? '–'}/10
                            </div>
                          </div>
                          
                          {entry.triggers && entry.triggers.length > 0 && (
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: '6px',
                              marginBottom: '8px'
                            }}>
                              {entry.triggers.map((trigger, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: '#FF5252',
                                    color: 'white',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setSelectedTrigger(trigger);
                                    setTab("triggers");
                                  }}
                                >
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {entry.thoughts && (
                            <div style={{ 
                              fontStyle: 'italic',
                              fontSize: '13px',
                              color: '#555',
                              marginTop: '8px'
                            }}>
                              "{entry.thoughts.substring(0, 100)}{entry.thoughts.length > 100 ? '...' : ''}"
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </ChartContainer>
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: "#888", textAlign: "center" }}>
          Период: {period === "all" ? "всё время" : `${period} дней`} • 
          Записей: {filteredEntries.length}
        </div>
      </div>
    </>
  );
};

export default StressPage;