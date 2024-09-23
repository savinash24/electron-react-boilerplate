import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface LineData {
  name: string;
  type: string;
  data: [string, number][];
  lineStyle: {
    type: string;
    color: string;
    width: number;
  };
}

const useKeyPress = (targetKey: string, callback: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        callback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [callback]);
};

const EChartsComponent: React.FC = () => {
  const [dynamicLines, setDynamicLines] = useState<LineData[]>(
    generateDynamicLines(),
  );
  const [moveAmount, setMoveAmount] = useState(100000); // Default speed
  const speedFactor = 2; // Adjust speed
  const chartRef = useRef<any>(null);
  const [selectedLineName, setSelectedLineName] = useState<string | null>(null); // Track selected line
  const [zoomState, setZoomState] = useState<{ start: number; end: number }>({
    start: 0,
    end: 100,
  });

  useEffect(() => {
    // Set initial zoom level to 10% on load
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance();
      chartInstance.dispatchAction({
        type: 'dataZoom',
        start: zoomState.start,
        end: zoomState.end,
      });
    }
  }, []);

  const updateChart = () => {
    const chartInstance = chartRef.current.getEchartsInstance();
    chartInstance.setOption({
      series: [...generateStaticLines(), ...dynamicLines],
      dataZoom: [{ start: zoomState.start, end: zoomState.end }],
    });
  };

  const moveSelectedGroup = (moveAmount: number) => {
    if (!selectedLineName) return; // If no line is selected, do nothing

    const chartInstance = chartRef.current.getEchartsInstance();
    const option = chartInstance.getOption();
    const minX = new Date(option.xAxis[0].min).getTime();
    const maxX = new Date(option.xAxis[0].max).getTime();

    const updatedLines: any = dynamicLines.map((line) => {
      if (line.name === selectedLineName) {
        const firstPointTime = new Date(line.data[0][0]).getTime();
        const lastPointTime = new Date(
          line.data[line.data.length - 1][0],
        ).getTime();

        // Prevent movement if it exceeds x-axis bounds
        if (
          (moveAmount < 0 && firstPointTime + moveAmount < minX) ||
          (moveAmount > 0 && lastPointTime + moveAmount > maxX)
        ) {
          alert('Movement exceeds chart boundaries.');
          return line; // No movement if it's out of bounds
        }

        // Move within valid bounds
        const newData = line.data.map(([time, value]: [string, number]) => {
          const newTime = new Date(time).getTime() + moveAmount;
          return [new Date(newTime).toISOString(), value];
        });
        return { ...line, data: newData };
      }
      return line;
    });

    setDynamicLines(updatedLines);
    updateChart(); // Update the chart without resetting zoom state
  };

  useKeyPress('ArrowLeft', () => {
    moveSelectedGroup(-moveAmount / speedFactor);
  });

  useKeyPress('ArrowRight', () => {
    moveSelectedGroup(moveAmount / speedFactor);
  });

  useKeyPress('Escape', () => {
    setSelectedLineName(null); // Deselect line on Escape
    const updatedLines = dynamicLines.map((line) => ({
      ...line,
      lineStyle: {
        ...line.lineStyle,
        color: line.lineStyle.color.replace('blue', 'green'),
        width: 2,
      }, // Reset to original style
    }));
    setDynamicLines(updatedLines);
  });

  const handleChartClick = (params: any) => {
    if (params.seriesType === 'line') {
      const lineName = params.seriesName;
      const updatedLines = dynamicLines.map((line) => {
        if (line.name === lineName) {
          // Toggle selection on click
          if (selectedLineName === lineName) {
            setSelectedLineName(null); // Deselect if already selected
            return {
              ...line,
              lineStyle: { ...line.lineStyle, color: 'green', width: 2 },
            }; // Reset to original style
          } else {
            setSelectedLineName(lineName); // Select the clicked line
            return {
              ...line,
              lineStyle: { type: 'solid', color: 'blue', width: 4 },
            }; // Highlight selected line
          }
        }
        return line;
      });

      setDynamicLines(updatedLines);
    }
  };

  const chartOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [
        ...generateStaticLines().map((line) => line.name),
        ...dynamicLines.map((line) => line.name),
      ],
    },
    xAxis: {
      type: 'time',
      name: 'Time',
      min: '2024-09-18T00:00:00Z',
      max: '2024-09-25T00:00:00Z',
      axisLabel: {
        formatter: (value: number) =>
          echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', value),
      },
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      min: 0,
    },
    series: [...generateStaticLines(), ...dynamicLines],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        start: zoomState.start,
        end: zoomState.end,
      },
      {
        type: 'slider',
        xAxisIndex: [0],
        start: zoomState.start,
        end: zoomState.end,
      },
    ],
  };

  return (
    <div>
      <ReactECharts
        ref={chartRef}
        option={chartOption}
        style={{ width: '1600px', height: '800px' }}
        onEvents={{ click: handleChartClick }}
      />
      <button onClick={() => setDynamicLines(generateDynamicLines())}>
        Reset
      </button>
    </div>
  );
};

// Function to generate static lines (unchanged)
function generateStaticLines(): LineData[] {
  const data1 = generateData();
  const data2 = generateData();
  return [
    {
      name: 'Parameter 1',
      type: 'line',
      data: data1,
      lineStyle: { color: 'red', width: 2, type: 'solid' },
    },
    {
      name: 'Parameter 2',
      type: 'line',
      data: data2,
      lineStyle: { color: 'yellow', width: 2, type: 'solid' },
    },
  ];
}

// Function to generate dynamic lines
function generateDynamicLines(): LineData[] {
  const dynamicLine1 = generateDataDynamic(1);
  const dynamicLine2 = generateDataDynamic(2);
  const dynamicLine3 = generateDataDynamic(3);
  const dynamicLine4 = generateDataDynamic(4);

  return [
    {
      name: 'Dynamic Line 1',
      type: 'line',
      data: dynamicLine1,
      lineStyle: { type: 'dotted', color: 'green', width: 2 },
    },
    {
      name: 'Dynamic Line 2',
      type: 'line',
      data: dynamicLine2,
      lineStyle: { type: 'dotted', color: 'blue', width: 2 },
    },
    {
      name: 'Dynamic Line 3',
      type: 'line',
      data: dynamicLine3,
      lineStyle: { type: 'dotted', color: 'orange', width: 2 },
    },
    {
      name: 'Dynamic Line 4',
      type: 'line',
      data: dynamicLine4,
      lineStyle: { type: 'dotted', color: 'pink', width: 2 },
    },
  ];
}

// Function to generate random data for both static and dynamic lines
function generateData(): [string, number][] {
  const data: [string, number][] = [];
  const startDate = new Date('2024-09-18T00:00:00Z');
  const numParameters = 200;

  for (let i = 0; i < numParameters; i++) {
    const timestamp = new Date(
      startDate.getTime() + i * 60 * 60 * 1000,
    ).toISOString();
    const value = Math.floor(Math.random() * 100);
    data.push([timestamp, value]);
  }

  return data;
}

function generateDataDynamic(n: number): [string, number][] {
  const data: [string, number][] = [];
  const startDate = new Date('2024-09-18T00:00:00Z');
  startDate.setDate(startDate.getDate() + n - 1);
  const numParameters = 100;

  for (let i = 0; i < numParameters; i++) {
    const timestamp = new Date(startDate.getTime() + i * 60 * 1000);
    const value = Math.floor(Math.random() * 100);
    data.push([timestamp.toISOString(), value]);
  }

  return data;
}

export default EChartsComponent;
