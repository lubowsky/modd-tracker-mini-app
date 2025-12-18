// // miniapp\src\pages\stats\Sleep.tsx
// import React, { useEffect } from "react";
// import { Header } from "../../components/Header";
// import { useSleepStore } from "../../store/sleepStore";
// import { ChartContainer } from "../../components/ChartContainer";
// import { usePageStore } from "../../store/pageStore";
// import { Button } from "../../components/Button";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// import { useEntriesStore } from "../../store/entriesStore";

// const SleepPage: React.FC = () => {
//   const entries = useEntriesStore((s) => s.entries);
//   const loading = useEntriesStore((s) => s.loading);
//   const goTo = usePageStore((s) => s.goTo);

//   const sleepData = entries
//     .filter(
//       (e) => e.sleepData && e.sleepData.quality !== undefined
//     )
//     .map((e) => ({
//       date: new Date(e.timestamp).toLocaleDateString(),
//       quality: e.sleepData!.quality ?? 0,
//       hours: e.sleepData!.hours ?? 0,
//     }))
//     .reverse();

//   console.log(sleepData)

//   return (
//     <>
//       <Header title="Статистика сна" />
//       <div style={{ padding: 16 }}>
//         <Button type="secondary" onClick={() => goTo("home")}>← Назад</Button>

//         <ChartContainer title="Качество сна">
//           {loading ? (
//             <p>Загрузка...</p>
//           ) : (
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={sleepData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis domain={[0, 10]} />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="quality" stroke="#4a90e2" strokeWidth={3} />
//               </LineChart>
//             </ResponsiveContainer>
//           )}
//         </ChartContainer>

//         <ChartContainer title="Длительность сна (часы)">
//           {loading ? (
//             <p>Загрузка...</p>
//           ) : (
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={sleepData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis domain={[0, 12]} />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="hours" stroke="#8bc34a" strokeWidth={3} />
//               </LineChart>
//             </ResponsiveContainer>
//           )}
//         </ChartContainer>
//       </div>
//     </>
//   );
// };

// export default SleepPage

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
} from "recharts";

type Period = 7 | 14 | 30 | "all";
type Tab = "charts" | "dreams";

const SleepDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.hasDream) return null;

  return (
    <text x={cx} y={cy - 8} textAnchor="middle" fontSize="14">
      💭
    </text>
  );
};

const SleepPage: React.FC = () => {
  const entries = useEntriesStore((s) => s.entries);
  const loading = useEntriesStore((s) => s.loading);
  const goTo = usePageStore((s) => s.goTo);

  const [period, setPeriod] = React.useState<Period>(7);
  const [tab, setTab] = React.useState<Tab>("charts");

  /** 1. Нормализация сна */
  const sleepEntries = React.useMemo(() => {
    return entries
      .filter((e) => e.sleepData)
      .sort(
        (a, b) => +new Date(a.timestamp) - +new Date(b.timestamp)
      );
  }, [entries]);

  /** 2. Фильтрация по периоду */
  const filteredEntries = React.useMemo(() => {
    if (period === "all") return sleepEntries;

    const from = new Date();
    from.setDate(from.getDate() - period);

    return sleepEntries.filter(
      (e) => new Date(e.timestamp) >= from
    );
  }, [sleepEntries, period]);

  /** 3. Данные для графиков */
  const sleepData = React.useMemo(() => {
    return filteredEntries.map((e) => ({
      date: new Date(e.timestamp).toLocaleDateString(),
      quality: e.sleepData?.quality ?? 0,
      hours: e.sleepData?.hours ?? 0,
      hasDream: Boolean(e.sleepData?.dreamDescription),
    }));
  }, [filteredEntries]);

  /** 4. Сны */
  const dreams = filteredEntries.filter(
    (e) => e.sleepData?.dreamDescription
  );

  return (
    <>
      <Header title="Статистика сна" />

      <div style={{ padding: 16 }}>
        <Button type="secondary" onClick={() => goTo("home")}>
          ← Назад
        </Button>

        {/* Выбор периода */}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {[7, 14, 30].map((p) => (
            <Button
              key={p}
              type={period === p ? "primary" : "secondary"}
              onClick={() => setPeriod(p as Period)}
            >
              {p} дней
            </Button>
          ))}
          <Button
            type={period === "all" ? "primary" : "secondary"}
            onClick={() => setPeriod("all")}
          >
            Всё
          </Button>
        </div>

        {/* Табы */}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <Button
            type={tab === "charts" ? "primary" : "secondary"}
            onClick={() => setTab("charts")}
          >
            Графики
          </Button>
          <Button
            type={tab === "dreams" ? "primary" : "secondary"}
            onClick={() => setTab("dreams")}
          >
            Сны
          </Button>
        </div>

        {/* ГРАФИКИ */}
        {tab === "charts" && (
          <>
            <ChartContainer title="Качество сна">
              {loading ? (
                <p>Загрузка...</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={sleepData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="quality"
                      stroke="#4a90e2"
                      strokeWidth={3}
                      dot={<SleepDot />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>

            <ChartContainer title="Длительность сна (часы)">
              {loading ? (
                <p>Загрузка...</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={sleepData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 12]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#8bc34a"
                      strokeWidth={3}
                      dot={<SleepDot />}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartContainer>
          </>
        )}

        {/* СНЫ */}
        {tab === "dreams" && (
          <ChartContainer title="Сны за период">
            {dreams.length === 0 ? (
              <p>Нет описаний снов за выбранный период</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {dreams.map((e) => (
                  <div
                    key={String(e._id)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "#f7f7f7",
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {new Date(e.timestamp).toLocaleDateString()}
                    </div>

                    <div style={{ margin: "4px 0" }}>
                      ⭐ {e.sleepData?.quality ?? "–"} / 10 · ⏱{" "}
                      {e.sleepData?.hours ?? "–"} ч
                    </div>

                    <div style={{ fontStyle: "italic" }}>
                      “{e.sleepData?.dreamDescription}”
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartContainer>
        )}
      </div>
    </>
  );
};

export default SleepPage;
