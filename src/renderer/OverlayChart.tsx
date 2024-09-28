/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { EChartOption } from 'echarts';

const OverlayCharts: React.FC = () => {
  const chartRef = useRef<ReactECharts | null>(null);
  //   const chartInstance: any = chartRef.current?.getEchartsInstance();
  const chartObject: any = {
    staticLines: [],
    dynamicLines: [],
    selectedLine: '',
    speedFactor: 10,
  };
  const [moveAmount, setMoveAmount] = useState(1000000);
  // const [speedFactor, setSpeedFactor] = useState(1);
  // const [selectedLine, setSelectedLine] = useState<string | null>(null);
  // const [staticLines, setStaticLines] = useState<any[]>([]);
  const handleFileSelect = async () => {
    getOption();
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
            chartObject.staticLines = parsedData;
            const chartInstance = chartRef.current?.getEchartsInstance();
            if (chartInstance) {
              // const normalizedDynamicLines = normalizeData(
              //   chartObject.dynamicLines,
              // );
              // const normalizedStaticLines = normalizeData(
              //   chartObject.staticLines,
              // );
              const normalizedStaticLines = chartObject.staticLines.map(
                (line: any) => {
                  if (line.name !== 'Reference Line') {
                    return { ...line, data: normalizeData(line.data) };
                  }
                  return line;
                },
              );
              const normalizedDynamicLines = chartObject.dynamicLines.map(
                (line: any) => {
                  if (line.name !== 'Reference Line') {
                    return { ...line, data: normalizeData(line.data) };
                  }
                  return line;
                },
              );
              console.log(
                normalizedDynamicLines,
                'normalizedDynamicLines',
                normalizedStaticLines,
              );

              chartInstance.setOption({
                tooltip: {
                  trigger: 'axis',
                  formatter: (params: any) => {
                    return params
                      .map(
                        (param: any) =>
                          `${param.seriesName}: ${param.data[3]}<br/>Timestamp: ${new Date(param.data[0]).toLocaleString()}`,
                      )
                      .join('<br/>');
                  },
                },
                series: [...normalizedDynamicLines, ...normalizedStaticLines],
                //   ...chartObject.staticLines,
                //   ...chartObject.dynamicLines,
                // ],
                legend: {
                  data: [
                    ...normalizedStaticLines.map((line: any) => line.name),
                    ...normalizedDynamicLines.map((line: any) => line.name),
                  ],
                },
              });
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

  const selectLine = (lineName: string) => {
    const chartInstance = chartRef.current?.getEchartsInstance();
    // setSelectedLine((prevSelected) =>
    //   prevSelected === lineName ? null : lineName,
    // );
    chartObject.selectedLine =
      chartObject.selectedLine === lineName ? null : lineName;
    // Directly modify the chart's option to avoid re-rendering
    const newDynamicLInes = [...chartObject.dynamicLines];
    if (chartInstance) {
      chartInstance.setOption({
        series: newDynamicLInes.map((line) => ({
          name: line.name,
          lineStyle: {
            type: chartObject.selectedLine === line.name ? 'solid' : 'dotted',
            color:
              chartObject.selectedLine === line.name
                ? 'blue'
                : line.lineStyle.color,
            width: chartObject.selectedLine === line.name ? 4 : 2,
          },
        })),
      });
    }
  };

  useEffect(() => {
    // getOption()
    const chartInstance: any = chartRef.current?.getEchartsInstance();
    const dynamicLinesInit: any = [
      {
        name: 'Dynamic Line 1',
        type: 'line',
        data: [
          ['2024-09-12T04:51:20.000Z', 24.2, 'PR-2'],
          ['2024-09-12T05:51:43.000Z', 22.2, 'PR-1'],
          ['2024-09-12T06:51:44.000Z', 26.2, 'PR-3'],
        ],
        lineStyle: { type: 'dotted', color: 'green', width: 2 },
        selected: false,
      },
    ];
    chartObject.dynamicLines = dynamicLinesInit;
    console.log(chartObject);
    chartInstance.setOption(getOption());
  }, []);

  const moveSelectedGroup = (amount: number) => {
    const chartInstance: any = chartRef.current?.getEchartsInstance();
    const existingSeries: any = [...chartInstance.getOption().series];
    console.log({ existingSeries });
    existingSeries.map((line: any) => {
      console.log({ line });

      if (line.name === chartObject?.selectedLine) {
        const newData = line.data.map(([time, value]: [string, number]) => {
          const newTime = new Date(time).getTime() + amount;
          return [newTime, value];
        });
        console.log(line.data, { newData });
        line.data = newData;
        // const minX = new Date('2024-09-11T00:00:00Z').getTime();
        // const maxX = new Date('2024-09-14T00:00:00Z').getTime();
        // const firstPoint = new Date(newData[0][0]).getTime();
        // const lastPoint = new Date(newData[newData.length - 1][0]).getTime();

        // if (firstPoint >= minX && lastPoint <= maxX) {
        //   return { ...line, data: newData };
        // }
        // return { ...line, data: newData };
        return line;
      }
      console.log({ modifiedLine: line });
      return line;
    });
    console.log({ newSeries: existingSeries });

    chartInstance.setOption({ series: [...existingSeries] });
    console.log('Movement', amount);
    return null;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        moveSelectedGroup(-moveAmount / chartObject.speedFactor);
      } else if (event.key === 'ArrowRight') {
        moveSelectedGroup(moveAmount / chartObject.speedFactor);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chartObject.selectedLine, moveAmount, chartObject.speedFactor]);

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
    console.log('normalizedData', modifiedData);

    return modifiedData;
  };
  const getOption = (): EChartOption => {
    const normalizedStaticData = chartObject?.staticLines.map((line: any) => {
      if (line.name !== 'Reference Line') {
        return { ...line, data: normalizeData(line.data) };
      }
      return line;
    });
    console.log('enters into getOption');
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          return params
            .map(
              (param: any) =>
                `${param.seriesName}: ${param.data[1]}<br/>Timestamp: ${new Date(param.data[0]).toLocaleString()}`,
            )
            .join('<br/>');
        },
      },
      legend: {
        data: [
          ...chartObject?.staticLines.map((line: any) => line.name),
          ...chartObject?.dynamicLines.map((line: any) => line.name),
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
        ...chartObject?.dynamicLines.map((line: any) => ({
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
          end: 10,
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

  function setSpeedFactor(arg0: number): any {
    console.log('LLLL',chartObject.speedFactor, arg0);
    chartObject.speedFactor = arg0;

    // return 0;
  }

  return (
    <div>
      <button onClick={handleFileSelect}>Select JSON File</button>
      <button onClick={handleDownloadJSON}>Download JSON</button>
      {/* {chartObject?.staticLines.length > 0 ? ( */}
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
      {/* ) : (
          <p>Please select a JSON file to load the chart.</p>
        )} */}

      <label htmlFor="speedControl">Movement Speed:</label>
      <input
        type="range"
        id="speedControl"
        min="1"
        max="10"
        value={chartObject.speedFactor}
        onChange={(e) => setSpeedFactor(Number(e.target.value))}
      />
    </div>
  );
  return <></>;
};
export default OverlayCharts;
