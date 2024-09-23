import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

const DynamicECharts: React.FC = () => {
    const [dynamicLines, setDynamicLines] = useState<any[]>([]);
    const [staticLines, setStaticLines] = useState<any[]>([]);
    const [moveAmount, setMoveAmount] = useState(100000); // Default speed: 1 second
    const [speedFactor, setSpeedFactor] = useState(2);

    // Generate static data
    const generateData = () => {
        const data = [];
        const startDate = new Date('2024-09-18T00:00:00Z');
        const numDays = 5;
        const numParameters = 100;

        for (let day = 0; day < numDays; day++) {
            for (let i = 0; i < numParameters; i++) {
                const timestamp = new Date(startDate.getTime() + day * 16 * 60 * 60 * 1000 + i * 60 * 1000);
                const value = Math.floor(Math.random() * 100);
                data.push([timestamp.toISOString(), value]);
            }
        }
        return data;
    };

    // Generate dynamic line data
    const lineGenData = (n: number) => {
        const data = [];
        const startDate = new Date('2024-09-18T00:00:00Z');
        startDate.setDate(startDate.getDate() + n - 1);
        const numParameters = 100;

        for (let i = 0; i < numParameters; i++) {
            const timestamp = new Date(startDate.getTime() + i * 60 * 1000);
            const value = Math.floor(Math.random() * 100);
            data.push([timestamp.toISOString(), value]);
        }
        return data;
    };

    useEffect(() => {
        const staticLinesInit = [
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
            }
        ];

        const dynamicLinesInit = [
            {
                name: 'Dynamic Line 1',
                type: 'line',
                data: lineGenData(1),
                lineStyle: { type: 'dotted', color: 'green', width: 2 },
                selected: false
            },
            {
                name: 'Dynamic Line 1-1',
                type: 'line',
                data: lineGenData(1),
                lineStyle: { type: 'dotted', color: 'blue', width: 2 },
                selected: false
            },
            {
                name: 'Dynamic Line 2',
                type: 'line',
                data: lineGenData(2),
                lineStyle: { type: 'dotted', color: 'orange', width: 2 },
                selected: false
            },
            {
                name: 'Dynamic Line 3',
                type: 'line',
                data: lineGenData(3),
                lineStyle: { type: 'dotted', color: 'pink', width: 2 },
                selected: false
            },
        ];

        setDynamicLines(dynamicLinesInit);
        setStaticLines(staticLinesInit);
    }, []);

    const getOption = () => {
        return {
            tooltip: { trigger: 'axis' },
            legend: {
                data: [
                    ...staticLines.map(line => line.name),
                    ...dynamicLines.map(line => line.name)
                ]
            },
            xAxis: {
                type: 'time',
                name: 'Time',
                min: '2024-09-18T00:00:00Z',
                max: '2024-09-25T00:00:00Z',
                axisLabel: {
                    formatter: (value: any) => {
                        return echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', value);
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Value',
                min: 0
            },
            series: [
                ...staticLines,
                ...dynamicLines.map(line => ({
                    ...line,
                    itemStyle: {
                        color: line.selected ? 'blue' : line.lineStyle.color
                    }
                }))
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                },
                {
                    type: 'slider',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                }
            ]
        };
    };

    const selectLine = (line: any) => {
        setDynamicLines(prevLines => prevLines.map(l => {
            const selected = l.name === line.name ? !l.selected : false; // Toggle the selected state
            return {
                ...l,
                selected,
                lineStyle: {
                    type: selected ? 'solid' : 'dotted',
                    color: selected ? 'blue' : l.lineStyle.color,
                    width: selected ? 4 : 2
                }
            };
        }));
    };

    const moveSelectedGroup = (amount: number) => {
        setDynamicLines(prevLines => prevLines.map(line => {
            if (line.selected) {
                const newData = line.data.map(([time, value]: [any, any]) => {
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
        }));
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
    }, [moveAmount, speedFactor]);

    return (
        <div>
            <ReactECharts 
                option={getOption()} 
                style={{ height: '800px', width: '1600px' }}
                onEvents={{
                    click: (params:any) => {
                        if (params.componentType === 'series') {
                            selectLine(params.seriesName); // Call selectLine on click
                        }
                    }
                }}
            />
            <label htmlFor="speedControl">Movement Speed:</label>
            <input
                type="range"
                id="speedControl"
                min="1"
                max="10"
                defaultValue={speedFactor}
                onChange={(e) => setSpeedFactor(Number(e.target.value))}
            />
        </div>
    );
};

export default DynamicECharts;
