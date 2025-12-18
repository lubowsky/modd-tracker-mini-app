import { ChartContainer } from "../../components/ChartContainer";
import React from "react";
import { Header } from "../../components/Header";

const Activities: React.FC = () => {
  return (
    <>
      <Header title="Активности" />
      <div style={{ padding: 16 }}>
        <ChartContainer title="Активности">График активностей</ChartContainer>;
      </div>
    </>
  );
};

export default Activities
