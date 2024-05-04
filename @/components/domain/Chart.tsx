import { ReactNode, useEffect, useState } from "react";

type Props = {
  type: string;
  w: string;
  data: any;
  options?: any;
};

export const SeasonChart = ({ type, data, w, options }: Props) => {
  const [chart, setChart] = useState<ReactNode | null>(null);
  useEffect(() => {
    // クライアントサイド環境でのみ動的インポートを実行
    if (typeof window !== "undefined") {
      loadChart();
    }
  }, []);

  async function loadChart(): Promise<void> {
    // @ts-ignore
    const Chart = (await import("react-apexcharts")).default.default;

    setChart(
      <Chart
        options={{
          ...options,
          theme: {
            palette: "palette10",
          },
          stroke: {
            width: 4,
          },
        }}
        series={data}
        type={type}
        width={w}
      />
    );
  }

  return <div className="mixed-chart">{chart || <p>Loading chart...</p>}</div>;
};
