import React from "react";
import { Header } from "../../components/Header";
import { ChartContainer } from "../../components/ChartContainer";
import { Button } from "../../components/Button";
import { useEntriesStore } from "../../store/entriesStore";
import { usePageStore } from "../../store/pageStore";
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
  Cell,
} from "recharts";
import { PeriodSelector } from "../../components/PeriodSelector";
import BackButton from "../../components/BackButton";

type Period = 7 | 14 | 30 | "all";
type Tab = "charts" | "details";

const EmotionDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.hasNotes) return null;

  return (
    <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12">
      📝
    </text>
  );
};

const EmotionsPage: React.FC = () => {
  const entries = useEntriesStore((s) => s.entries);
  const loading = useEntriesStore((s) => s.loading);
  const goTo = usePageStore((s) => s.goTo);

  const [period, setPeriod] = React.useState<Period>(7);
  const [tab, setTab] = React.useState<Tab>("charts");
  const [selectedEmotion, setSelectedEmotion] = React.useState<string | null>(null);

  /** 1. Нормализация записей с эмоциями */
  const emotionEntries = React.useMemo(() => {
    const safeEntries = Array.isArray(entries) ? entries : [];
    
    return safeEntries
      .filter((e) => e?.emotions && e.emotions.length > 0)
      .sort(
        (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)
      );
  }, [entries]);

  /** 2. Фильтрация по периоду */
  const filteredEntries = React.useMemo(() => {
    if (period === "all") return emotionEntries;

    const from = new Date();
    from.setDate(from.getDate() - period);

    return emotionEntries.filter(
      (e) => e?.timestamp && new Date(e.timestamp) >= from
    );
  }, [emotionEntries, period]);

  /** 3. Агрегация эмоций по частоте и интенсивности */
  const emotionStats = React.useMemo(() => {
    const emotionMap = new Map<string, { 
      totalIntensity: number; 
      count: number; 
      entries: any[];
      dates: Date[];
    }>();
    
    filteredEntries.forEach(entry => {
      entry.emotions?.forEach(emotion => {
        if (!emotion?.name) return;
        
        const existing = emotionMap.get(emotion.name);
        if (existing) {
          existing.totalIntensity += emotion.intensity || 0;
          existing.count += 1;
          existing.entries.push(entry);
          existing.dates.push(new Date(entry.timestamp));
        } else {
          emotionMap.set(emotion.name, {
            totalIntensity: emotion.intensity || 0,
            count: 1,
            entries: [entry],
            dates: [new Date(entry.timestamp)]
          });
        }
      });
    });

    return Array.from(emotionMap.entries())
      .map(([name, data]) => ({
        name,
        averageIntensity: data.count > 0 ? data.totalIntensity / data.count : 0,
        frequency: data.count,
        entries: data.entries,
        dates: data.dates,
        lastOccurrence: data.dates.length > 0 
          ? Math.max(...data.dates.map(d => d.getTime()))
          : 0
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }, [filteredEntries]);

  /** 4. Данные для графика средней интенсивности по дням */
  const intensityData = React.useMemo(() => {
    const dayMap = new Map<string, { total: number; count: number }>();
    
    filteredEntries.forEach(entry => {
      const dateStr = new Date(entry.timestamp).toLocaleDateString();
      const dayData = dayMap.get(dateStr) || { total: 0, count: 0 };
      
      if (entry.emotions && entry.emotions.length > 0) {
        const avgIntensity = entry.emotions.reduce((sum, e) => sum + (e.intensity || 0), 0) 
                           / entry.emotions.length;
        dayData.total += avgIntensity;
        dayData.count += 1;
      }
      
      dayMap.set(dateStr, dayData);
    });
    
    return Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        avgIntensity: data.count > 0 ? data.total / data.count : 0,
        hasNotes: filteredEntries.some(e => 
          new Date(e.timestamp).toLocaleDateString() === date && 
          e.notes && e.notes.trim().length > 0
        )
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  /** 5. Данные для графика частоты эмоций по дням */
  const frequencyData = React.useMemo(() => {
    const dayMap = new Map<string, number>();
    
    filteredEntries.forEach(entry => {
      const dateStr = new Date(entry.timestamp).toLocaleDateString();
      const currentCount = dayMap.get(dateStr) || 0;
      dayMap.set(dateStr, currentCount + (entry.emotions?.length || 0));
    });
    
    return Array.from(dayMap.entries())
      .map(([date, frequency]) => ({
        date,
        frequency,
        hasNotes: filteredEntries.some(e => 
          new Date(e.timestamp).toLocaleDateString() === date && 
          e.notes && e.notes.trim().length > 0
        )
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries]);

  /** 6. Данные для графика конкретной эмоции */
  const selectedEmotionData = React.useMemo(() => {
    if (!selectedEmotion) return [];
    
    return filteredEntries
      .filter(entry => 
        entry.emotions?.some(e => e.name === selectedEmotion)
      )
      .map(entry => {
        const emotion = entry.emotions?.find(e => e.name === selectedEmotion);
        return {
          date: new Date(entry.timestamp).toLocaleDateString(),
          intensity: emotion?.intensity ?? 0,
          overallMental: entry.overallMental ?? 0,
          overallPhysical: entry.overallPhysical ?? 0,
          hasNotes: Boolean(entry.notes && entry.notes.trim().length > 0),
          notes: entry.notes
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredEntries, selectedEmotion]);

  /** 7. Цвет для эмоций */
  const getEmotionColor = (emotionName: string): string => {
    const colorMap: Record<string, string> = {
      'радость': '#FFD700',      // золотой
      'счастье': '#FFB347',      // светло-оранжевый
      'удовлетворение': '#77DD77', // светло-зеленый
      'спокойствие': '#AEC6CF',   // пастельно-голубой
      'любовь': '#FF6961',       // светло-красный
      'грусть': '#779ECB',       // пастельно-синий
      'печаль': '#B19CD9',       // светло-фиолетовый
      'тоска': '#836953',        // коричневый
      'злость': '#FF6961',       // красный
      'раздражение': '#F49AC2',  // пастельно-розовый
      'гнев': '#FF0000',         // ярко-красный
      'ярость': '#8B0000',       // темно-красный
      'страх': '#CFCFC4',        // серый
      'тревога': '#FFB347',      // оранжевый
      'паника': '#FFA500',       // ярко-оранжевый
      'усталость': '#C23B22',    // кирпичный
      'апатия': '#966FD6',       // фиолетовый
      'волнение': '#FF69B4',     // розовый
      'надежда': '#77DD77',      // зеленый
      'гордость': '#FFD700',     // желтый
      'вина': '#AEC6CF',         // серо-голубой
      'стыд': '#DEA5A4',         // пастельно-красный
      'ревность': '#FDFD96',     // пастельно-желтый
      'зависть': '#966FD6',      // фиолетовый
    };
    
    return colorMap[emotionName.toLowerCase()] || '#8884d8'; // стандартный цвет
  };

  /** 8. Сгруппированные эмоции по категориям */
  const emotionCategories = React.useMemo(() => {
    const categories: Record<string, { emotions: typeof emotionStats; color: string }> = {
      'Положительные': { emotions: [], color: '#77DD77' },
      'Отрицательные': { emotions: [], color: '#FF6961' },
      'Нейтральные': { emotions: [], color: '#AEC6CF' },
      'Другие': { emotions: [], color: '#8884d8' }
    };
    
    const positiveEmotions = ['радость', 'счастье', 'удовлетворение', 'спокойствие', 'любовь', 'надежда', 'гордость', 'волнение'];
    const negativeEmotions = ['грусть', 'печаль', 'тоска', 'злость', 'раздражение', 'гнев', 'ярость', 'страх', 'тревога', 'паника', 'усталость', 'апатия', 'вина', 'стыд', 'ревность', 'зависть'];
    
    emotionStats.forEach(stat => {
      const emotionLower = stat.name.toLowerCase();
      
      if (positiveEmotions.includes(emotionLower)) {
        categories['Положительные'].emotions.push(stat);
      } else if (negativeEmotions.includes(emotionLower)) {
        categories['Отрицательные'].emotions.push(stat);
      } else if (['спокойствие', 'нейтральность', 'равнодушие'].includes(emotionLower)) {
        categories['Нейтральные'].emotions.push(stat);
      } else {
        categories['Другие'].emotions.push(stat);
      }
    });
    
    return Object.entries(categories)
      .filter(([_, data]) => data.emotions.length > 0)
      .map(([name, data]) => ({
        name,
        emotions: data.emotions.sort((a, b) => b.frequency - a.frequency),
        color: data.color,
        totalFrequency: data.emotions.reduce((sum, e) => sum + e.frequency, 0)
      }));
  }, [emotionStats]);

  return (
    <>
      <Header title="Статистика эмоций" />

      <div style={{ padding: 16 }}>
        <BackButton />
        <PeriodSelector period={period} onPeriodChange={setPeriod} />

        {/* Вкладки */}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Button
            type={tab === "charts" ? "primary" : "secondary"}
            onClick={() => setTab("charts")}
          >
            Графики
          </Button>
          <Button
            type={tab === "details" ? "primary" : "secondary"}
            onClick={() => setTab("details")}
          >
            Детали эмоций
          </Button>
        </div>

        {tab === "charts" && (
          <>
            {/* График средней интенсивности эмоций */}
            <ChartContainer title="Средняя интенсивность эмоций">
              {loading ? (
                <p>Загрузка...</p>
              ) : filteredEntries.length === 0 ? (
                <p>Нет данных об эмоциях за выбранный период</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={intensityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}/10`, 'Интенсивность']}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgIntensity"
                      stroke="#8884d8"
                      strokeWidth={3}
                      dot={<EmotionDot />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* График частоты эмоций по дням */}
            <ChartContainer title="Количество эмоций в день">
              {loading ? (
                <p>Загрузка...</p>
              ) : filteredEntries.length === 0 ? (
                <p>Нет данных об эмоциях за выбранный период</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={frequencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Количество эмоций']}
                      labelFormatter={(label) => `Дата: ${label}`}
                    />
                    <Bar 
                      dataKey="frequency" 
                      fill="#82ca9d" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            {/* Распределение эмоций по категориям */}
            {emotionCategories.length > 0 && (
              <ChartContainer title="Распределение по категориям">
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 12,
                  padding: '8px 0'
                }}>
                  {emotionCategories.map((category) => (
                    <div key={category.name} style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: category.color
                      }}>
                        <span>{category.name}</span>
                        <span>{category.totalFrequency} упоминаний</span>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '6px',
                        marginBottom: '8px'
                      }}>
                        {category.emotions.slice(0, 8).map((emotion) => (
                          <div
                            key={emotion.name}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '16px',
                              background: getEmotionColor(emotion.name),
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              opacity: 0.9
                            }}
                            onClick={() => {
                              setSelectedEmotion(emotion.name);
                              setTab("details");
                            }}
                            title={`${emotion.name}: ${emotion.frequency} раз, средняя интенсивность: ${emotion.averageIntensity.toFixed(1)}`}
                          >
                            {emotion.name} ({emotion.frequency})
                          </div>
                        ))}
                        
                        {category.emotions.length > 8 && (
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            background: '#f0f0f0',
                            color: '#666',
                            fontSize: '12px'
                          }}>
                            +{category.emotions.length - 8} еще
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ChartContainer>
            )}
          </>
        )}

        {tab === "details" && (
          <>
            {selectedEmotion ? (
              <>
                <Button 
                  type="secondary" 
                  onClick={() => setSelectedEmotion(null)}
                  style={{ marginBottom: 16 }}
                >
                  ← Назад ко всем эмоциям
                </Button>

                <ChartContainer title={`Эмоция: ${selectedEmotion}`}>
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
                      background: getEmotionColor(selectedEmotion)
                    }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {selectedEmotion}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {emotionStats.find(e => e.name === selectedEmotion)?.frequency || 0} упоминаний
                      </div>
                    </div>
                  </div>

                  {selectedEmotionData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={selectedEmotionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip 
                            formatter={(value, name) => {
                              if (name === 'intensity') return [`${value}/10`, 'Интенсивность'];
                              if (name === 'overallMental') return [`${value}/10`, 'Психическое состояние'];
                              if (name === 'overallPhysical') return [`${value}/10`, 'Физическое состояние'];
                              return [value, name];
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="intensity"
                            stroke={getEmotionColor(selectedEmotion)}
                            strokeWidth={3}
                            dot={<EmotionDot />}
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      {/* Детали записей с этой эмоцией */}
                      <div style={{ marginTop: 24 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: 12,
                          color: '#444'
                        }}>
                          Записи с эмоцией "{selectedEmotion}"
                        </div>
                        
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 12,
                          maxHeight: '300px',
                          overflowY: 'auto'
                        }}>
                          {selectedEmotionData.map((entry, index) => {
                            const originalEntry = filteredEntries.find(e => 
                              new Date(e.timestamp).toLocaleDateString() === entry.date &&
                              e.emotions?.some(em => em.name === selectedEmotion && em.intensity === entry.intensity)
                            );
                            
                            return (
                              <div
                                key={index}
                                style={{
                                  padding: '12px',
                                  borderRadius: '8px',
                                  background: '#f9f9f9',
                                  borderLeft: `4px solid ${getEmotionColor(selectedEmotion)}`
                                }}
                              >
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#666',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginBottom: '6px'
                                }}>
                                  <span>{entry.date}</span>
                                  <span style={{ fontWeight: 'bold' }}>
                                    Интенсивность: {entry.intensity}/10
                                  </span>
                                </div>
                                
                                {originalEntry && (
                                  <>
                                    {originalEntry.thoughts && (
                                      <div style={{ 
                                        margin: '8px 0', 
                                        fontStyle: 'italic',
                                        fontSize: '14px'
                                      }}>
                                        "{originalEntry.thoughts}"
                                      </div>
                                    )}
                                    
                                    <div style={{ 
                                      display: 'flex', 
                                      gap: '12px', 
                                      fontSize: '12px',
                                      color: '#666'
                                    }}>
                                      <span>🧠 {originalEntry.overallMental ?? '–'}/10</span>
                                      <span>💪 {originalEntry.overallPhysical ?? '–'}/10</span>
                                      {originalEntry.stressLevel && (
                                        <span>⚡ {originalEntry.stressLevel}/10</span>
                                      )}
                                    </div>
                                    
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
                    <p>Нет данных для выбранной эмоции</p>
                  )}
                </ChartContainer>
              </>
            ) : (
              <>
                <ChartContainer title="Все эмоции за период">
                  {loading ? (
                    <p>Загрузка...</p>
                  ) : emotionStats.length === 0 ? (
                    <p>Нет данных об эмоциях за выбранный период</p>
                  ) : (
                    <>
                      {/* Топ эмоций */}
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          marginBottom: 12,
                          color: '#444'
                        }}>
                          Самые частые эмоции
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {emotionStats.slice(0, 10).map((stat, index) => (
                            <div
                              key={stat.name}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                background: '#fff',
                                border: '1px solid #eee',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                ':hover': {
                                  transform: 'translateX(4px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }
                              }}
                              onClick={() => setSelectedEmotion(stat.name)}
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
                                    background: getEmotionColor(stat.name)
                                  }} />
                                  <span style={{ fontWeight: 'bold' }}>
                                    {index + 1}. {stat.name}
                                  </span>
                                </div>
                                
                                <div style={{ display: 'flex', gap: 16, fontSize: '12px' }}>
                                  <span style={{ color: '#666' }}>
                                    {stat.frequency} упоминаний
                                  </span>
                                  <span style={{ 
                                    fontWeight: 'bold',
                                    color: getEmotionColor(stat.name)
                                  }}>
                                    {stat.averageIntensity.toFixed(1)}/10
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

                      {/* Общая статистика */}
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
                          📊 Общая статистика за период
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4a90e2' }}>
                              {filteredEntries.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>дней с эмоциями</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8bc34a' }}>
                              {emotionStats.length}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>уникальных эмоций</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                              {emotionStats.reduce((sum, stat) => sum + stat.frequency, 0)}
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

        <div style={{ marginTop: 20, fontSize: 12, color: "#888", textAlign: "center" }}>
          Период: {period === "all" ? "всё время" : `${period} дней`} • 
          Записей: {filteredEntries.length}
        </div>
      </div>
    </>
  );
};

export default EmotionsPage;