// src/pages/stats/Physical.tsx
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
} from "recharts";

type Period = 7 | 14 | 30 | "all";
type Tab = "charts" | "symptoms" | "overview";

const PhysicalDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.hasNotes) return null;

  return (
    <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12">
      📝
    </text>
  );
};

const PhysicalPage: React.FC = () => {
  const entries = useEntriesStore((s) => s.entries);
  const loading = useEntriesStore((s) => s.loading);

  const [period, setPeriod] = React.useState<Period>(7);
  const [tab, setTab] = React.useState<Tab>("charts");
  const [selectedSymptom, setSelectedSymptom] = React.useState<string | null>(null);

  /** 1. Нормализация записей */
  const physicalEntries = React.useMemo(() => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    
    return safeEntries
      .filter((e) => e?.overallPhysical !== undefined)
      .sort(
        (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)
      );
  }, [entries]);

  /** 2. Фильтрация по периоду */
  const filteredEntries = React.useMemo(() => {
    if (period === "all") return physicalEntries;

    const from = new Date();
    from.setDate(from.getDate() - period);

    return physicalEntries.filter(
      (e) => e?.timestamp && new Date(e.timestamp) >= from
    );
  }, [physicalEntries, period]);

  /** 3. Данные для графика физического состояния */
  const physicalData = React.useMemo(() => {
    return filteredEntries.map((e) => ({
      date: new Date(e.timestamp).toLocaleDateString(),
      physicalScore: e.overallPhysical ?? 0,
      mentalScore: e.overallMental ?? 0,
      stressLevel: e.stressLevel ?? 0,
      hasNotes: Boolean(e.notes && e.notes.trim().length > 0),
      hasSymptoms: e.physicalSymptoms && e.physicalSymptoms.length > 0,
    }));
  }, [filteredEntries]);

  /** 4. Статистика симптомов */
  const symptomStats = React.useMemo(() => {
    const symptomMap = new Map<string, { 
      frequency: number;
      entries: any[];
      dates: Date[];
      lastIntensity: number;
    }>();
    
    filteredEntries.forEach(entry => {
      entry.physicalSymptoms?.forEach(symptom => {
        if (!symptom?.name) return;
        
        const existing = symptomMap.get(symptom.name);
        if (existing) {
          existing.frequency += 1;
          existing.entries.push(entry);
          existing.dates.push(new Date(entry.timestamp));
          existing.lastIntensity = symptom.intensity || 0;
        } else {
          symptomMap.set(symptom.name, {
            frequency: 1,
            entries: [entry],
            dates: [new Date(entry.timestamp)],
            lastIntensity: symptom.intensity || 0
          });
        }
      });
    });

    return Array.from(symptomMap.entries())
      .map(([name, data]) => ({
        name,
        frequency: data.frequency,
        entries: data.entries,
        dates: data.dates,
        lastIntensity: data.lastIntensity,
        lastOccurrence: data.dates.length > 0 
          ? Math.max(...data.dates.map(d => d.getTime()))
          : 0,
        percentage: (data.frequency / filteredEntries.length) * 100
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }, [filteredEntries]);

  /** 5. Данные для графика частоты симптомов по дням */
  const symptomFrequencyData = React.useMemo(() => {
    const dayMap = new Map<string, { 
      symptomCount: number; 
      symptomNames: string[];
    }>();
    
    filteredEntries.forEach(entry => {
      const dateStr = new Date(entry.timestamp).toLocaleDateString();
      const dayData = dayMap.get(dateStr) || { symptomCount: 0, symptomNames: [] };
      
      if (entry.physicalSymptoms && entry.physicalSymptoms.length > 0) {
        dayData.symptomCount += entry.physicalSymptoms.length;
        dayData.symptomNames.push(
          ...entry.physicalSymptoms.map(s => s.name)
        );
      }
      
      dayMap.set(dateStr, dayData);
    });
    
    return Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        symptomCount: data.symptomCount,
        symptomNames: [...new Set(data.symptomNames)], // уникальные симптомы за день
        hasNotes: filteredEntries.some(e => 
          new Date(e.timestamp).toLocaleDateString() === date && 
          e.notes && e.notes.trim().length > 0
        )
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  /** 6. Данные для графика конкретного симптома */
  const selectedSymptomData = React.useMemo(() => {
    if (!selectedSymptom) return [];
    
    return filteredEntries
      .filter(entry => 
        entry.physicalSymptoms?.some(s => s.name === selectedSymptom)
      )
      .map(entry => {
        const symptom = entry.physicalSymptoms?.find(s => s.name === selectedSymptom);
        return {
          date: new Date(entry.timestamp).toLocaleDateString(),
          intensity: symptom?.intensity ?? 0,
          physicalScore: entry.overallPhysical ?? 0,
          mentalScore: entry.overallMental ?? 0,
          stressLevel: entry.stressLevel ?? 0,
          hasNotes: Boolean(entry.notes && entry.notes.trim().length > 0),
          notes: entry.notes,
          timeOfDay: entry.timeOfDay
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries, selectedSymptom]);

  /** 7. Цвет для симптомов */
  const getSymptomColor = (symptomName: string): string => {
    const colorMap: Record<string, string> = {
      'головная боль': '#FF6B6B',        // красный
      'усталость': '#FFA726',           // оранжевый
      'боль в животе': '#4ECDC4',       // бирюзовый
      'тошнота': '#66BB6A',             // зеленый
      'головокружение': '#42A5F5',      // синий
      'боль в спине': '#AB47BC',        // фиолетовый
      'озноб': '#26C6DA',               // голубой
      'жар': '#EF5350',                 // ярко-красный
      'слабость': '#FFCA28',            // желтый
      'боль в горле': '#7E57C2',        // темно-фиолетовый
      'насморк': '#29B6F6',             // светло-синий
      'кашель': '#26A69A',              // зеленый-бирюзовый
      'одышка': '#FF7043',              // оранжево-красный
      'боль в суставах': '#8D6E63',     // коричневый
      'мышечная боль': '#78909C',       // серо-синий
      'бессонница': '#5C6BC0',          // индиго
      'сонливость': '#FFB74D',          // светло-оранжевый
      'потеря аппетита': '#A1887F',     // серо-коричневый
      'тревожность': '#F48FB1',         // розовый
      'раздражительность': '#CE93D8',   // светло-фиолетовый
    };
    
    return colorMap[symptomName.toLowerCase()] || '#78909C'; // стандартный серо-синий
  };

  /** 8. Общая статистика */
  const overallStats = React.useMemo(() => {
    const daysWithSymptoms = filteredEntries.filter(e => 
      e.physicalSymptoms && e.physicalSymptoms.length > 0
    ).length;
    
    const avgPhysicalScore = filteredEntries.length > 0
      ? filteredEntries.reduce((sum, e) => sum + (e.overallPhysical || 0), 0) / filteredEntries.length
      : 0;
    
    const worstDay = filteredEntries.reduce((worst, current) => {
      if (!worst || (current.overallPhysical || 0) < (worst.overallPhysical || 0)) {
        return current;
      }
      return worst;
    }, null as any);
    
    const bestDay = filteredEntries.reduce((best, current) => {
      if (!best || (current.overallPhysical || 0) > (best.overallPhysical || 0)) {
        return current;
      }
      return best;
    }, null as any);
    
    return {
      daysWithSymptoms,
      percentageWithSymptoms: (daysWithSymptoms / filteredEntries.length) * 100,
      avgPhysicalScore,
      worstDay,
      bestDay,
      totalSymptoms: symptomStats.reduce((sum, stat) => sum + stat.frequency, 0),
      uniqueSymptoms: symptomStats.length
    };
  }, [filteredEntries, symptomStats]);

  return (
    <>
      <Header title="Физическое состояние" />

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
            type={tab === "symptoms" ? "primary" : "secondary"}
            onClick={() => setTab("symptoms")}
          >
            Симптомы
          </Button>
          <Button
            type={tab === "overview" ? "primary" : "secondary"}
            onClick={() => setTab("overview")}
          >
            Обзор
          </Button>
        </div>

        {tab === "charts" && (
          <>
            {/* График физического состояния */}
            <ChartContainer title="Физическое состояние (1-10)">
              {loading ? (
                <p>Загрузка...</p>
              ) : filteredEntries.length === 0 ? (
                <p>Нет данных о физическом состоянии за выбранный период</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={physicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'physicalScore') return [`${value}/10`, 'Физическое состояние'];
                        if (name === 'mentalScore') return [`${value}/10`, 'Психическое состояние'];
                        if (name === 'stressLevel') return [`${value}/10`, 'Уровень стресса'];
                        return [value, name];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="physicalScore"
                      stroke="#FF6B6B"
                      strokeWidth={3}
                      dot={<PhysicalDot />}
                      name="Физическое состояние"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* График количества симптомов по дням */}
            {symptomFrequencyData.length > 0 && (
              <ChartContainer title="Количество симптомов в день">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={symptomFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'symptomCount') return [value, 'Количество симптомов'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Bar 
                      dataKey="symptomCount" 
                      fill="#4ECDC4" 
                      radius={[4, 4, 0, 0]}
                      name="Симптомы"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}

            {/* Сравнение физического и психического состояния */}
            <ChartContainer title="Сравнение физического и психического состояния">
              {loading ? (
                <p>Загрузка...</p>
              ) : filteredEntries.length === 0 ? (
                <p>Нет данных за выбранный период</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={physicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="physicalScore"
                      stroke="#FF6B6B"
                      strokeWidth={3}
                      name="Физическое"
                    />
                    <Line
                      type="monotone"
                      dataKey="mentalScore"
                      stroke="#42A5F5"
                      strokeWidth={3}
                      name="Психическое"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>
          </>
        )}

        {tab === "symptoms" && (
          <>
            {selectedSymptom ? (
              <>
                <Button 
                  type="secondary" 
                  onClick={() => setSelectedSymptom(null)}
                  style={{ marginBottom: 16 }}
                >
                  ← Назад ко всем симптомам
                </Button>

                <ChartContainer title={`Симптом: ${selectedSymptom}`}>
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
                      background: getSymptomColor(selectedSymptom)
                    }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {selectedSymptom}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {symptomStats.find(s => s.name === selectedSymptom)?.frequency || 0} упоминаний
                      </div>
                    </div>
                  </div>

                  {selectedSymptomData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={selectedSymptomData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'intensity') return [`${value}/10`, 'Интенсивность симптома'];
                              if (name === 'physicalScore') return [`${value}/10`, 'Физическое состояние'];
                              if (name === 'mentalScore') return [`${value}/10`, 'Психическое состояние'];
                              if (name === 'stressLevel') return [`${value}/10`, 'Уровень стресса'];
                              return [value, name];
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="intensity"
                            stroke={getSymptomColor(selectedSymptom)}
                            strokeWidth={3}
                            name="Интенсивность"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Детали записей с этим симптомом */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: 12,
                          color: '#444'
                        }}>
                          Записи с симптомом "{selectedSymptom}"
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 12,
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {selectedSymptomData.map((entry, index) => {
                            const originalEntry = filteredEntries.find(e => 
                              new Date(e.timestamp).toLocaleDateString() === entry.date &&
                              e.physicalSymptoms?.some(s => s.name === selectedSymptom)
                            );
                            
                            return (
                              <div
                                key={index}
                                style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  background: '#f9f9f9',
                                  borderLeft: `4px solid ${getSymptomColor(selectedSymptom)}`
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
                                  <span style={{ fontWeight: 'bold' }}>
                                    Интенсивность: {entry.intensity}/10
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
                                      <span>💪 Физическое: {originalEntry.overallPhysical ?? '–'}/10</span>
                                      <span>🧠 Психическое: {originalEntry.overallMental ?? '–'}/10</span>
                                      {originalEntry.stressLevel && (
                                        <span>⚡ Стресс: {originalEntry.stressLevel}/10</span>
                                      )}
                                    </div>
                                    
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
                    <p>Нет данных для выбранного симптома</p>
                  )}
                </ChartContainer>
              </>
            ) : (
              <>
                <ChartContainer title="Все симптомы за период">
                  {loading ? (
                    <p>Загрузка...</p>
                  ) : symptomStats.length === 0 ? (
                    <div>
                      <p>Нет данных о симптомах за выбранный период</p>
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        Симптомы добавляются в записях настроения в разделе "Физические симптомы"
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Топ симптомов */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: 12,
                          color: '#444'
                        }}>
                          Самые частые симптомы
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {symptomStats.slice(0, 10).map((stat, index) => (
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
                              onClick={() => setSelectedSymptom(stat.name)}
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
                                    background: getSymptomColor(stat.name)
                                  }} />
                                  <span style={{ fontWeight: 'bold' }}>
                                    {index + 1}. {stat.name}
                                  </span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: 16, fontSize: '12px' }}>
                                  <span style={{ color: '#666' }}>
                                    {stat.frequency} раз
                                  </span>
                                  <span style={{ 
                                    fontWeight: 'bold',
                                    color: getSymptomColor(stat.name)
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
                                {stat.lastIntensity > 0 && ` • Интенсивность: ${stat.lastIntensity}/10`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Общая статистика симптомов */}
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
                          📊 Статистика симптомов
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a90e2' }}>
                              {overallStats.daysWithSymptoms}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>дней с симптомами</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8bc34a' }}>
                              {overallStats.uniqueSymptoms}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>уникальных симптомов</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                              {overallStats.totalSymptoms}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>всего упоминаний</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </ChartContainer>
              </>
            )}
          </>
        )}

        {tab === "overview" && (
          <ChartContainer title="Обзор физического состояния">
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
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Среднее состояние</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.avgPhysicalScore.toFixed(1)}/10
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
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Дней с симптомами</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.daysWithSymptoms}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      {overallStats.percentageWithSymptoms.toFixed(1)}% от периода
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Лучший день</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.bestDay?.overallPhysical || 0}/10
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      {overallStats.bestDay ? new Date(overallStats.bestDay.timestamp).toLocaleDateString('ru-RU') : '—'}
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>Худший день</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                      {overallStats.worstDay?.overallPhysical || 0}/10
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                      {overallStats.worstDay ? new Date(overallStats.worstDay.timestamp).toLocaleDateString('ru-RU') : '—'}
                    </div>
                  </div>
                </div>

                {/* Распределение симптомов */}
                {symptomStats.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      marginBottom: '12px',
                      color: '#444'
                    }}>
                      Распределение симптомов
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {symptomStats.slice(0, 15).map((stat) => (
                        <div
                          key={stat.name}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: getSymptomColor(stat.name),
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            opacity: 0.9
                          }}
                          onClick={() => {
                            setSelectedSymptom(stat.name);
                            setTab("symptoms");
                          }}
                          title={`${stat.name}: ${stat.frequency} раз (${stat.percentage.toFixed(1)}% дней)`}
                        >
                          {stat.name} ({stat.frequency})
                        </div>
                      ))}
                      
                      {symptomStats.length > 15 && (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: '#f0f0f0',
                          color: '#666',
                          fontSize: '12px'
                        }}>
                          +{symptomStats.length - 15} еще
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Последние записи */}
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    marginBottom: '12px',
                    color: '#444'
                  }}>
                    Последние записи
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {filteredEntries
                      .slice()
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 10)
                      .map((entry) => (
                        <div
                          key={String(entry._id)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: '#f9f9f9',
                            borderLeft: `4px solid ${entry.overallPhysical && entry.overallPhysical >= 7 ? '#4CAF50' : 
                                       entry.overallPhysical && entry.overallPhysical >= 5 ? '#FFC107' : '#F44336'}`
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
                            gap: '16px', 
                            fontSize: '14px',
                            marginBottom: '8px'
                          }}>
                            <div style={{ fontWeight: 'bold', color: '#FF6B6B' }}>
                              💪 {entry.overallPhysical ?? '–'}/10
                            </div>
                            <div style={{ color: '#42A5F5' }}>
                              🧠 {entry.overallMental ?? '–'}/10
                            </div>
                            {entry.stressLevel && (
                              <div style={{ color: '#FFA726' }}>
                                ⚡ {entry.stressLevel}/10
                              </div>
                            )}
                          </div>
                          
                          {entry.physicalSymptoms && entry.physicalSymptoms.length > 0 && (
                            <div style={{ 
                              display: 'flex', 
                              flexWrap: 'wrap', 
                              gap: '6px',
                              marginBottom: '8px'
                            }}>
                              {entry.physicalSymptoms.map((symptom, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: getSymptomColor(symptom.name),
                                    color: 'white',
                                    fontSize: '11px'
                                  }}
                                >
                                  {symptom.name}
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

export default PhysicalPage;
