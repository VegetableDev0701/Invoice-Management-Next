import React, { useRef, useEffect, useState } from "react";
import {
  Chart,
  ChartConfiguration,
  registerables,
  TooltipItem,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import { formatNumber } from "@/lib/utility/formatter";
import { CostCodeItem, Divisions } from "@/lib/models/budgetCostCodeModel";
import { ChartEvent } from "chart.js/dist/core/core.plugins";
import { createIndividualChartData } from "./BudgetToActualCharts";
Chart.register(...registerables);
Chart.register(ChartDataLabels);

// Define the props interface
interface BarChartProps {
  data: ChartConfiguration["data"];
  minBarWidth: number;
  title: string;
  division: string;
  subDivision?: string | null;
  fullData: Divisions;
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
  const [title, setTitle] = useState(_title);
  const [level, setLevel] = useState<Array<number>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const totalBarWidth = minBarWidth * (chartData.labels?.length || 0);

  const getCurrentLevelData = () => {
    let levelData: Divisions | CostCodeItem = fullData;
    for (let i = 0; i < level.length; i++) {
      let index = level[i];
      if (levelData.subItems.length <= index) {
        console.error("[getCurrentLevelData]: Error!");
        return;
      }

      levelData = levelData.subItems[index];
    }

    return levelData;
  };

  const zoomIn = (index: number) => {
    const currentLevelData = getCurrentLevelData();
    const selectedData = currentLevelData.subItems[index];
    if (selectedData.subItems.length === 0) {
      console.warn("[getCurrentLevelData]: There is no sub-items");
      return;
    }

    setLevel([...level, index]);
  };

  const zoomOut = () => {
    if (level.length === 0) {
      console.warn("[getCurrentLevelData]: This is the top level element");
      return;
    }

    const newLevel = [...level];
    newLevel.pop();
    setLevel(newLevel);
  };

  useEffect(() => {
    const currentLevelData = getCurrentLevelData();

    const { chartDataResult, title, dropZeroSubDivIndex } =
      createIndividualChartData({
        title: currentLevelData.name,
        division: currentLevelData.number,
        subDivision: null,
        chartData: currentLevelData.subItems,
        filterZeroElements: filterZeroElements,
      });
    
    setChartData(chartDataResult);
    setTitle(title);
  }, [fullData, level]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const chart = new Chart(ctx, {
          type: "bar",
          data: {
            ...chartData,
            datasets: chartData.datasets.map((dataset) => ({
              ...dataset,
              categoryPercentage: 0.8,
              barPercentage: 1,
            })),
          },
          options: {
            borderColor: "black",
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 300, // general animation time
            },
            elements: {
              bar: {
                borderRadius: 10,
                inflateAmount: "auto",
              },
            },
            plugins: {
              legend: {
                display: true,
                align: "start",
                position: "right",
                title: {
                  display: false,
                  padding: 0,
                },
                labels: {
                  font: {
                    size: 18,
                    weight: "bold",
                  },
                },
              },
              datalabels: {
                anchor: "end",
                align: "top",
                offset: -3,
                font: {
                  size: 16,
                  weight: "normal",
                },
                formatter: (value, context) => {
                  return +value > 0 ? `${formatNumber(Math.round(value))}` : "";
                },
              },
              tooltip: {
                position: "nearest",
                titleFont: {
                  size: 18,
                  family: "Helvetica",
                },
                bodyFont: {
                  size: 16,
                  family: "Helvetica",
                },
                backgroundColor: "rgba(0,0,0,1)",
                callbacks: {
                  label: (context: TooltipItem<"bar">) => {
                    const index = context.dataIndex;
                    // only calculate the percents of total for the actuals.
                    if (context.dataset.label === "Actual") {
                      const actualValue = formatNumber(
                        (+context.formattedValue.replaceAll(",", "")).toFixed(2)
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
                    if (context.dataset.label === "Budget") {
                      const budgetValue = formatNumber(
                        (+context.formattedValue.replaceAll(",", "")).toFixed(2)
                      );
                      return [`Budget: $${budgetValue}`];
                    }
                  },
                },
              },
              title: {
                display: true,
                text: title,
                align: "start",
                padding: {
                  bottom: 25,
                },
                font: {
                  size: 24,
                  family: "Helvetica",
                },
              },
            },
            scales: {
              x: {
                border: { width: 2, color: "gray" },
                beginAtZero: true,
                grid: {
                  display: false,
                  lineWidth: 10,
                },
                ticks: {
                  font: { family: "Helvetica", size: 16, weight: "bold" },
                },
              },
              y: {
                border: { width: 2, color: "gray" },
                beginAtZero: true,
                grid: { display: false },
                title: {
                  display: true,
                  text: "Dollars",
                  align: "center",
                  font: {
                    size: 20,
                  },
                },
                ticks: {
                  font: {
                    family: "Helvetica",
                    size: 16,
                  },
                },
              },
            },
            events: ["click", "contextmenu"],
            // If a subdivision should not be shown, and go straight to the cost codes,
            onClick: (e: ChartEvent, elements) => {
              if (e.type === "contextmenu") {
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
                    "pointer";
                } else {
                  (event.native.target as HTMLButtonElement).style.cursor =
                    chartElement.length > 0 ? "pointer" : "default";
                }
              }
            },
          },
          plugins: [
            {
              id: "chart",
              afterInit: (obj, args, options) => {
                obj.canvas.addEventListener(
                  "contextmenu",
                  handleContextMenu,
                  false
                );

                function handleContextMenu(e) {
                  e.preventDefault();
                  return false;
                }
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

  return <canvas ref={canvasRef} style={{ width: `1000px` }} />;
  //   return <canvas ref={canvasRef} />;
};

export default BarChart;
