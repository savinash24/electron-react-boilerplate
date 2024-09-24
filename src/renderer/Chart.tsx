import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';

const DynamicECharts: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  const [dynamicLines, setDynamicLines] = useState<any[]>([]);
  const [staticLines, setStaticLines] = useState<any[]>([]);
  const [moveAmount, setMoveAmount] = useState(100000);
  const [speedFactor, setSpeedFactor] = useState(2);
  const [selectedLine, setSelectedLine] = useState<string | null>(null); // New state to track the selected line

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
            const parsedData: any[] = JSON.parse(result);
            setStaticLines(parsedData);
            console.log(parsedData);
          };
          reader.readAsText(file);
        }
      };
      fileInput.click();
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };

  useEffect(() => {
    const dynamicLinesInit: any = [
      {
        name: 'Dynamic Line 1',
        type: 'line',
        data: [
          ["2024-09-12T04:51:20.000Z", 24.2],
          ["2024-09-12T05:51:43.000Z", 22.2],
          ["2024-09-12T06:51:44.000Z", 26.2],
        ],
        lineStyle: { type: 'dotted', color: 'green', width: 2 },
        selected: false,
      },
    ];
    setDynamicLines(dynamicLinesInit);
  }, []);

  const getOption = (): EChartOption => {
    const normalizeData = (data: number[][]): number[][] => {
      const arrayOfValues = data.map(point => point[1]);
      const max = Math.max(...arrayOfValues);
      const min = Math.min(...arrayOfValues);

      return data.map(point => [
        point[0],
        (point[1] - min) / (max - min),
        point[2],
        point[1],
      ]);
    };

    const normalizedStaticData = staticLines.map(line => {
      if (line.name !== 'Reference Line') {
        return { ...line, data: normalizeData(line.data) };
      }
      return line;
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params:any) => {
          return params
            .map((param:any) => `${param.seriesName}: ${param.data[3]}<br/>Timestamp: ${new Date(param.data[0]).toLocaleString()}`)
            .join('<br/>');
        },
      },
      legend: {
        data: [
          ...staticLines.map(line => line.name),
          ...dynamicLines.map(line => line.name),
        ],
      },
      xAxis: {
        type: 'time',
        name: 'Time',
        min: '2024-09-11T00:00:00Z',
        max: '2024-09-13T00:00:00Z',
        axisLabel: {
          formatter: (value:any) => echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', value),
        },
      },
      yAxis: {
        show: false,
      },
      series: [
        ...normalizedStaticData,
        ...dynamicLines.map(line => ({
          ...line,
          lineStyle: {
            type: selectedLine === line.name ? 'solid' : 'dotted',
            color: selectedLine === line.name ? 'blue' : line.lineStyle.color,
            width: selectedLine === line.name ? 4 : 2,
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

  const selectLine = (lineName: string) => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    console.log('Pre SelectLIne', getOption());
    // console.log('Pre ChartInstance', chartInstance?.getOption());
    setSelectedLine(prevSelected => (prevSelected === lineName ? null : lineName)); // Toggle selection
    

    // Directly modify the chart's option to avoid re-rendering
    let newDynamicLInes = [...dynamicLines]
    if (chartInstance) {
      chartInstance.setOption({
        series: newDynamicLInes.map(line => ({
          name: line.name,
          lineStyle: {
            type: lineName === line.name ? 'solid' : 'dotted',
            color: lineName === line.name ? 'blue' : line.lineStyle.color,
            width: lineName === line.name ? 4 : 2,
          },
        })),
      });
    }
    console.log('Post SelectLIne', getOption());
    console.log('Post ChartInstance', chartRef.current?.getEchartsInstance().getOption());
  };

  const moveSelectedGroup = (amount: number) => {
    setDynamicLines(prevLines =>
      prevLines.map(line => {
        if (line.name === selectedLine) {
          const newData = line.data.map(([time, value]: [string, number]) => {
            const newTime = new Date(time).getTime() + amount;
            return [newTime, value];
          });

          const minX = new Date('2024-09-18T00:00:00Z').getTime();
          const maxX = new Date('2024-09-25T00:00:00Z').getTime();
          const firstPoint = new Date(newData[0][0]).getTime();
          const lastPoint = new Date(newData[newData.length - 1][0]).getTime();

          if (firstPoint >= minX && lastPoint <= maxX) {
            return { ...line, data: newData };
          }
        }
        return line;
      }),
    );
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
  }, [moveAmount, speedFactor, selectedLine]);

  return (
    <div>
      <button onClick={handleFileSelect}>Select JSON File</button>
      {staticLines.length > 0 ? (
        <ReactECharts 
          ref={chartRef} 
          option={getOption()}
          style={{ height: '800px', width: '1600px' }}
          onEvents={{
            click: (params: any) => {
              if (params.componentType === 'series') {
                selectLine(params.seriesName);
              }
            },
          }}
        />
      ) : (
        <p>Please select a JSON file to load the chart.</p>
      )}
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
  );
};

export default DynamicECharts;
