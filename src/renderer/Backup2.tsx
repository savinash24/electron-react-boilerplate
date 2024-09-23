import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface DynamicLine {
  name: string;
  data: [string, number][];
  lineStyle: { type: string; color: string; width: number };
  selected: boolean;
}

const DynamicECharts: React.FC = () => {
  const [dynamicLines, setDynamicLines] = useState<DynamicLine[]>([]);
  const [moveAmount, setMoveAmount] = useState<number>(100000);
  const chartRef = useRef<any>(null);

  const generateData = () => {
    const data: [string, number][] = [];
    const startDate = new Date('2024-09-18T00:00:00Z');
    const numDays = 5;
    const numParameters = 200;

    for (let day = 0; day < numDays; day++) {
      for (let i = 0; i < numParameters; i++) {
        const timestamp = new Date(
          startDate.getTime() + day * 16 * 60 * 60 * 1000 + i * 60 * 5 * 1000,
        );
        const value = Math.floor(Math.random() * 100);
        data.push([timestamp.toISOString(), value]);
      }
    }
    return data;
  };

  const lineGenData = (n: number) => {
    const data: [string, number][] = [];
    const startDate = new Date('2024-09-18T00:00:00Z');
    startDate.setDate(startDate.getDate() + n - 1);
    const numParameters = 50;

    for (let i = 0; i < numParameters; i++) {
      const timestamp = new Date(startDate.getTime() + i * 60 * 1000);
      const value = Math.floor(Math.random() * 100);
      data.push([timestamp.toISOString(), value]);
    }
    return data;
  };

  const staticLines = [
    {
      name: 'Parameter 1',
      type: 'line',
      data: generateData(),
      lineStyle: { color: 'red', width: 2 },
    },
    {
      name: 'Parameter 2',
      type: 'line',
      data: generateData(),
      lineStyle: { color: 'yellow', width: 2 },
    },
  ];

  const initializeDynamicLines = () => {
    const lines: DynamicLine[] = [
      {
        name: 'Dynamic Line 1',
        data: lineGenData(1),
        lineStyle: { type: 'dotted', color: 'green', width: 2 },
        selected: false,
      },
      {
        name: 'Dynamic Line 1-1',
        data: lineGenData(1),
        lineStyle: { type: 'dotted', color: 'blue', width: 2 },
        selected: false,
      },
      {
        name: 'Dynamic Line 2',
        data: lineGenData(2),
        lineStyle: { type: 'dotted', color: 'orange', width: 2 },
        selected: false,
      },
      {
        name: 'Dynamic Line 3',
        data: lineGenData(3),
        lineStyle: { type: 'dotted', color: 'pink', width: 2 },
        selected: false,
      },
    ];
    setDynamicLines(lines);
    console.log('Initialized Dynamic Lines:', lines); // Debugging line
    updateChart(); // Ensure chart is updated after initialization
  };

  useEffect(() => {
    initializeDynamicLines();
  }, []);

  const createSeries = () => [
    ...staticLines,
    ...dynamicLines.map((line) => ({
      ...line,
      selected: undefined, // Remove selected flag from series data
    })),
  ];

  const getOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: {
      data: [
        ...staticLines.map((line) => line.name),
        ...dynamicLines.map((line) => line.name),
      ],
    },
    xAxis: {
      type: 'time',
      name: 'Time',
      min: '2024-09-18T00:00:00Z',
      max: '2024-09-25T00:00:00Z',
      /* The `axisLabel` property in the ECharts options object is used to customize the appearance of the
axis labels on the chart. In this specific case: */
      axisLabel: {
        formatter: (value: any) =>
          echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', value),
      },
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      min: 0,
    },
    series: createSeries(),
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        start: 0,
        end: 100,
      },
    ],
  });

  const updateChart = () => {
    chartRef.current?.getEchartsInstance().setOption(getOption());
  };

  const selectLine = (lineName: string) => {
    const updatedLines = dynamicLines.map((line) => ({
      ...line,
      selected: line.name === lineName ? !line.selected : false,
      lineStyle: {
        type: line.name === lineName && line.selected ? 'solid' : 'dotted',
        color: line.lineStyle.color,
        width: line.name === lineName && line.selected ? 4 : 2,
      },
    }));
    setDynamicLines(updatedLines);
    updateChart();
  };

  const moveSelectedGroup = (amount: number) => {
    const updatedLines: any = dynamicLines.map((line) => {
      if (line.selected) {
        const newData = line.data.map(([time, value]: [any, any]) => {
          const newTime = new Date(time).getTime() + amount;
          return [new Date(newTime).toISOString(), value]; // Ensure the timestamp is in ISO format
        });
        return { ...line, data: newData };
      }
      return line;
    });
    setDynamicLines(updatedLines);
    updateChart();
  };

  const canMoveLeft = () =>
    dynamicLines.some(
      (line) =>
        line.selected &&
        new Date(line.data[line.data.length - 1][0]).getTime() >
          new Date('2024-09-18T00:00:00Z').getTime(),
    );
  const canMoveRight = () =>
    dynamicLines.some(
      (line) =>
        line.selected &&
        new Date(line.data[0][0]).getTime() <
          new Date('2024-09-25T00:00:00Z').getTime(),
    );

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && canMoveLeft()) {
      moveSelectedGroup(-moveAmount);
    } else if (event.key === 'ArrowRight' && canMoveRight()) {
      moveSelectedGroup(moveAmount);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dynamicLines]);

  return (
    <div>
      <ReactECharts
        ref={chartRef}
        option={getOption()}
        style={{ height: '800px', width: '1600px' }}
      />
      <button
        onClick={() =>
          setDynamicLines((lines) =>
            lines.map((line) => ({ ...line, selected: false })),
          )
        }
      >
        Reset Position
      </button>
      <label htmlFor="speedControl">Movement Speed:</label>
      <input
        type="range"
        id="speedControl"
        min="1"
        max="10"
        value={moveAmount / 100000}
        onChange={(e) => setMoveAmount(100000 * Number(e.target.value))}
      />
    </div>
  );
};

export default DynamicECharts;
