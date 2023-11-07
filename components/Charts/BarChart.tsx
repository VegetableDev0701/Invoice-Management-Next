import React, { useRef, useEffect, useState } from 'react';
import {
  Chart,
  ChartConfiguration,
  registerables,
  TooltipItem,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { formatNumber } from '@/lib/utility/formatter';
import { CostCodeItem, Divisions } from '@/lib/models/budgetCostCodeModel';
import { ChartEvent } from 'chart.js/dist/core/core.plugins';
import { createIndividualChartData } from './BudgetToActualCharts';
import {
  CostCodeItemB2AData,
  DivisionDataV2,
} from '@/lib/models/chartDataModels';
Chart.register(...registerables);
Chart.register(ChartDataLabels);

// Define the props interface
interface BarChartProps {
  data: ChartConfiguration['data'];
  minBarWidth: number;
  title: string;
  division: string;
  subDivision?: string | null;
  fullData: DivisionDataV2;
  filterZeroElements?: boolean;
  dropZeroSubDivIndex?: number[] | null;
}

const BarChart = (props: BarChartProps) => {
  const {
    data,
    minBarWidth,
    title: _title,
    fullData,
    division,
    subDivision,
    filterZeroElements,
    dropZeroSubDivIndex,
  } = props;

  const [chartData, setChartData] = useState(data);
  const [title, setTitle] = useState<
    Array<{
      title: string;
      level: Array<number>;
    }>
  >([{ title: _title, level: [] }]);
  const [level, setLevel] = useState<Array<number>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const totalBarWidth = minBarWidth * (chartData.labels?.length || 0);

  const getCurrentLevelData = () => {
    let levelData: DivisionDataV2 | CostCodeItemB2AData = fullData;
    let prefix: Array<{
      title: string;
      level: Array<number>;
    }> = [{ title: _title, level: [] }];
    for (let i = 0; i < level.length; i++) {
      let index = level[i];
      if (!levelData.subItems || levelData.subItems?.length <= index) {
        console.error('[getCurrentLevelData]: Error!');
        return;
      }

      prefix.push({
        title: `${levelData.subItems[index].number} - ${levelData.subItems[index].name}`,
        level: level.slice(0, i + 1),
      });
      levelData = levelData.subItems[index];
    }

    return {
      data: levelData,
      prefix,
    };
  };

  const zoomIn = (index: number) => {
    const levelData = getCurrentLevelData();
    if (!levelData) return;
    const { data: currentLevelData } = levelData;
    const selectedData = currentLevelData.subItems
      ? currentLevelData.subItems[index]
      : undefined;
    if (!selectedData || selectedData.subItems?.length === 0) {
      console.warn('[getCurrentLevelData]: There is no sub-items');
      return;
    }

    setLevel([...level, index]);
  };

  const zoomOut = () => {
    if (level.length === 0) {
      console.warn('[getCurrentLevelData]: This is the top level element');
      return;
    }

    const newLevel = [...level];
    newLevel.pop();
    setLevel(newLevel);
  };

  useEffect(() => {
    const levelData = getCurrentLevelData();
    if (!levelData) return;
    const { data: currentLevelData, prefix } = levelData;

    const { chartDataResult } = createIndividualChartData({
      title: currentLevelData.name || '',
      division: currentLevelData.number,
      subDivision: null,
      chartData: currentLevelData.subItems,
      filterZeroElements: filterZeroElements,
    });

    setChartData(chartDataResult as ChartConfiguration['data']);
    setTitle(prefix);
  }, [fullData, level]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            ...chartData,
            datasets: chartData.datasets.map((dataset) => ({
              ...dataset,
              categoryPercentage: 0.8,
              barPercentage: 1,
            })),
          },
          options: {
            borderColor: 'black',
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 300, // general animation time
            },
            elements: {
              bar: {
                borderRadius: 10,
                inflateAmount: 'auto',
              },
            },
            plugins: {
              legend: {
                display: true,
                align: 'start',
                position: 'right',
                title: {
                  display: false,
                  padding: 0,
                },
                labels: {
                  font: {
                    size: 18,
                    weight: 'bold',
                  },
                },
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                offset: -3,
                font: {
                  size: 16,
                  weight: 'normal',
                },
                formatter: (value, context) => {
                  return +value > 0 ? `${formatNumber(Math.round(value))}` : '';
                },
              },
              tooltip: {
                position: 'nearest',
                titleFont: {
                  size: 18,
                  family: 'Helvetica',
                },
                bodyFont: {
                  size: 16,
                  family: 'Helvetica',
                },
                backgroundColor: 'rgba(0,0,0,1)',
                callbacks: {
                  label: (context: TooltipItem<'bar'>) => {
                    const index = context.dataIndex;
                    // only calculate the percents of total for the actuals.
                    if (context.dataset.label === 'Actual') {
                      const actualValue = formatNumber(
                        (+context.formattedValue.replaceAll(',', '')).toFixed(2)
                      );
                      let percentTotal =
                        (context.dataset.data[index] as number) /
                        (chartData.datasets[0].data as number[])[index];
                      percentTotal = isFinite(percentTotal) ? percentTotal : 1;
                      return [
                        `Actual: $${actualValue}`,
                        `Percent Complete: ${(percentTotal * 100).toFixed(2)}%`,
                      ];
                    }
                    if (context.dataset.label === 'Budget') {
                      const budgetValue = formatNumber(
                        (+context.formattedValue.replaceAll(',', '')).toFixed(2)
                      );
                      return [`Budget: $${budgetValue}`];
                    }
                  },
                },
              },
              title: {
                display: true,
                // text: title,
                text: '',
                align: 'start',
                padding: {
                  bottom: 25,
                },
                font: {
                  size: 24,
                  family: 'Helvetica',
                },
              },
            },
            scales: {
              x: {
                border: { width: 2, color: 'gray' },
                beginAtZero: true,
                grid: {
                  display: false,
                  lineWidth: 10,
                },
                ticks: {
                  font: { family: 'Helvetica', size: 16, weight: 'bold' },
                },
              },
              y: {
                border: { width: 2, color: 'gray' },
                beginAtZero: true,
                grid: { display: false },
                title: {
                  display: true,
                  text: 'Dollars',
                  align: 'center',
                  font: {
                    size: 20,
                  },
                },
                ticks: {
                  font: {
                    family: 'Helvetica',
                    size: 16,
                  },
                },
              },
            },
            events: ['click', 'contextmenu'],
            // If a subdivision should not be shown, and go straight to the cost codes,
            onClick: (e: ChartEvent, elements) => {
              if (e.type === 'contextmenu') {
                zoomOut();
              }

              if (elements.length > 0) {
                const { index } = elements[0];
                zoomIn(index);
              }

              // if (elements.length > 0 && !subDivision) {
              //   const chartElement = elements[0];
              //   const index = chartElement.index;

              //   const subDivisionNames =
              //     filterZeroElements && dropZeroSubDivIndex
              //       ? Object.values(fullData.subDivisions)
              //           .map((subDiv) => subDiv.subDivisionName)
              //           .filter(
              //             (_, index) => !dropZeroSubDivIndex.includes(index)
              //           )
              //       : Object.values(fullData.subDivisions).map(
              //           (subDiv) => subDiv.subDivisionName
              //         );

              //   // HACK If the subdivision name is "_" then we know that this should be ignored and, there will only ever
              //   // be a single subdivision with that name. This covers cases where a user has a two level nested cost code
              //   // or we just want to show the cost codes. The code was originally written for a three nested level cost code
              //   // setup...should eventually be changed by this hack works for now.
              //   const subDivName = subDivisionNames.every(
              //     (name) => name === '_'
              //   )
              //     ? subDivisionNames[0]
              //     : subDivisionNames[index];
              //   const subDivNumber =
              //     filterZeroElements && dropZeroSubDivIndex
              //       ? Object.keys(fullData.subDivisions)
              //           .sort((a, b) => Number(a) - Number(b))
              //           .filter(
              //             (_, index) => !dropZeroSubDivIndex.includes(index)
              //           )[index]
              //       : Object.keys(fullData.subDivisions).sort(
              //           (a, b) => Number(a) - Number(b)
              //         )[index];
              //   onClick(subDivNumber, division, subDivName);
              // } else if (subDivision === null || subDivision === undefined) {
              //   const subDivNumber = null;
              //   const subDivName = '_';
              //   onClick(subDivNumber, division, subDivName);
              // } else {
              //   const subDivNumber = null;
              //   const subDivName = null;
              //   onClick(subDivNumber, division, subDivName);
              // }
            },
            onHover(event, chartElement) {
              if (event?.native && event.native.target) {
                if (subDivision) {
                  (event.native.target as HTMLButtonElement).style.cursor =
                    'pointer';
                } else {
                  (event.native.target as HTMLButtonElement).style.cursor =
                    chartElement.length > 0 ? 'pointer' : 'default';
                }
              }
            },
          },
          plugins: [
            {
              id: 'chart',
              afterInit: (obj, args, options) => {
                function handleContextMenu(
                  e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
                ) {
                  e.preventDefault();
                }

                obj.canvas.addEventListener(
                  'contextmenu',
                  handleContextMenu as unknown as EventListener,
                  false
                );
              },
            },
          ],
        });

        return () => {
          chart.destroy();
        };
      }
    }
  }, [canvasRef, chartData]);

  const handleClickTitle = (level: Array<number>) => {
    setLevel(level);
  };

  return (
    <div className="relative">
      <div className="absolute top-0 w-full flex text-[25px] font-bold pl-[50px]">
        {title.map((item, index) => (
          <div key={index}>
            <span
              className="cursor-pointer hover:text-[#569092] transition-all mr-4"
              onClick={() => handleClickTitle(item.level)}
            >
              {item.title}
            </span>
            {index < title.length - 1 && <span className="mr-4">/</span>}
          </div>
        ))}
      </div>
      <div className="w-full h-96 px-10 pt-2">
        <canvas ref={canvasRef} style={{ width: `1000px` }} />
      </div>
    </div>
  );
  //   return <canvas ref={canvasRef} />;
};

export default BarChart;
