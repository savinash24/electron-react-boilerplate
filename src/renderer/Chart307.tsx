import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';

const OverlayCharts: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const chartObject: any = {
    staticLines: [],
    dynamicLines: [],
    selectedLine: '',
  };

  const [moveAmount, setMoveAmount] = useState(1000000);
  const [speedFactor, setSpeedFactor] = useState(2);

  // Function to handle file selection (restoring the chart)
  const handleFileSelect = async () => {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.onchange = (event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            try {
              const parsedData = JSON.parse(result);
  
              // Check if staticLines and dynamicLines exist; if not, assign empty arrays
              chartObject.staticLines = parsedData.staticLines || [];
              chartObject.dynamicLines = parsedData.dynamicLines || [];
  
              const chartInstance = chartRef.current?.getEchartsInstance();
              if (chartInstance) {
                const normalizedStaticLines = chartObject.staticLines.map((line: any) => {
                  if (line.name !== 'Reference Line') {
                    return { ...line, data: normalizeData(line.data) };
                  }
                  return line;
                });
  
                const normalizedDynamicLines = chartObject.dynamicLines.map((line: any) => {
                  if (line.name !== 'Reference Line') {
                    return { ...line, data: normalizeData(line.data) };
                  }
                  return line;
                });
  
                chartInstance.setOption({
                  series: [...normalizedDynamicLines, ...normalizedStaticLines],
                  legend: {
                    data: [
                      ...normalizedStaticLines.map((line: any) => line.name),
                      ...normalizedDynamicLines.map((line: any) => line.name),
                    ],
                  },
                });
              }
            } catch (parseError) {
              console.error('Failed to parse JSON:', parseError);
            }
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };
  

  // Function to download the current chart state as JSON
  const handleDownloadJSON = () => {
    const chartData = {
      staticLines: chartObject.staticLines,
      dynamicLines: chartObject.dynamicLines,
    };

    const jsonStr = JSON.stringify(chartData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-data.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const moveSelectedGroup = (amount: number) => {
    const chartInstance: any = chartRef.current?.getEchartsInstance();
    const existingSeries: any = [...chartInstance.getOption().series];

    existingSeries.map((line: any) => {
      if (line.name === chartObject?.selectedLine) {
        const newData = line.data.map(([time, value]: [string, number]) => {
          const newTime = new Date(time).getTime() + amount;
          return [newTime, value];
        });
        line.data = newData;
      }
      return line;
    });

    chartInstance.setOption({ series: [...existingSeries] });
    chartInstance.resize();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        moveSelectedGroup(-moveAmount / speedFactor);
      } else if (event.key === 'ArrowRight') {
        moveSelectedGroup(moveAmount / speedFactor);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chartObject.selectedLine, speedFactor]);

  const normalizeData = (data: number[][]): number[][] => {
    const arrayOfValues = data.map((point) => point[1]);
    const max = Math.max(...arrayOfValues);
    const min = Math.min(...arrayOfValues);

    const modifiedData = data.map((point) => [
      point[0],
      (point[1] - min) / (max - min),
      point[2],
      point[1],
    ]);

    return modifiedData;
  };

  const getOption = (): EChartOption => {
    const normalizedStaticData = chartObject?.['staticLines'].map(
      (line: any) => {
        if (line.name !== 'Reference Line') {
          return { ...line, data: normalizeData(line.data) };
        }
        return line;
      }
    );

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return params
            .map(
              (param: any) =>
                `${param.seriesName}: ${param.data[1]}<br/>Timestamp: ${new Date(param.data[0]).toLocaleString()}`
            )
            .join('<br/>');
        },
      },
      legend: {
        data: [
          ...chartObject?.['staticLines'].map((line: any) => line.name),
          ...chartObject?.['dynamicLines'].map((line: any) => line.name),
        ],
      },
      xAxis: {
        type: 'time',
        name: 'Time',
        min: '2024-09-11T00:00:00Z',
        max: '2024-09-13T00:00:00Z',
        axisLabel: {
          formatter: (value: any) =>
            echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', value),
        },
      },
      yAxis: {
        show: false,
      },
      series: [
        ...normalizedStaticData,
        ...chartObject?.['dynamicLines'].map((line: any) => ({
          ...line,
          lineStyle: {
            type: 'dotted',
            color: line.lineStyle.color,
            width: 2,
          },
        })),
      ],
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
    };
  };

  return (
    <>
      <div>
        <button onClick={handleFileSelect}>Upload JSON File</button>
        <button onClick={handleDownloadJSON}>Download JSON</button>
        <ReactECharts
          ref={chartRef}
          option={getOption()}
          style={{ height: '800px', width: '1600px' }}
          onEvents={{
            click: (params: any) => {
              if (params.componentType === 'series') {
                chartObject.selectedLine = params.seriesName;
              }
            },
          }}
        />
        <label htmlFor="speedControl">Movement Speed:</label>
        <input
          type="range"
          id="speedControl"
          min="1"
          max="10"
          value={speedFactor}
          onChange={(e) => setSpeedFactor(Number(e.target.value))}
        />
      </div>
    </>
  );
};

export default OverlayCharts;
