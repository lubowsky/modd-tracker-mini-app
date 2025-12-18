import React, { useEffect } from "react";
import { useStatsStore } from "../../store/statsStore";
import { ChartContainer } from "../../components/ChartContainer";
import { Header } from "../../components/Header";

const Overview: React.FC = () => {
  const { overview, loading, loadOverview } = useStatsStore();

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <>
        <Header title="Настроения" />
        <ChartContainer title="Общий индекс настроения">
            {overview ? "Здесь будет график" : "Нет данных"}
        </ChartContainer>
    </>
  );
};

export default Overview;
