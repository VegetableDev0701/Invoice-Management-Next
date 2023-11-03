import { useEffect, useState } from "react";

import { useAppSelector as useSelector } from "@/store/hooks";

import { formatNameForID } from "@/lib/utility/formatter";
import scrollToElement from "@/lib/utility/scrollToElement";

import classes from "../Forms/InputFormLayout/FormLayout.module.css";
import BarChart from "./BarChart";
import Card from "../UI/Card";
import {
  ChartData,
  ChartDataV2,
  CostCodeItemB2AData,
  DivisionData,
  DivisionDataV2,
} from "@/lib/models/chartDataModels";
import {
  CostCodeItem,
  CostCodesData,
  Divisions,
} from "@/lib/models/budgetCostCodeModel";

interface Props {
  formData: CostCodesData;
  clickedLink: string;
  dummyForceRender: boolean;
  anchorScrollElement: string;
  projectId: string;
  filterZeroElements: boolean;
}

export const calculateCostCode = (data: CostCodeItemB2AData) => {
  let total = 0;
  if (data.subItems?.length > 0) {
    data.subItems.forEach((item) => (total += calculateCostCode(item)));
  } else if (data.isCurrency) {
    total = Number(data.value);
  }
  return total;
};

export const calculateActual = (data: CostCodeItemB2AData) => {
  let total = 0;
  if (data.subItems?.length > 0) {
    data.subItems.forEach((item) => (total += calculateActual(item)));
  } else if (data.isCurrency) {
    total = Number(data.actual) || 0;
  }
  return total;
};

export const createIndividualChartData = ({
  title: _title,
  division,
  subDivision,
  subDivisionName,
  chartData,
  filterZeroElements,
}: {
  title: string;
  division: number;
  subDivision?: number | null;
  subDivisionName?: string;
  chartData: CostCodeItemB2AData[];
  filterZeroElements?: boolean;
}) => {
  const title = `${division} - ${_title}`;
  const fullData = chartData || [];
  const chartDataResult = {
    labels: chartData?.map((item) => `${item.number} - ${item.name}`),
    datasets: [
      {
        label: "Budget",
        backgroundColor: "rgba(86, 144, 146, 1)",
        data: chartData?.map((item) => calculateCostCode(item)),
      },
      {
        label: "Actual",
        backgroundColor: "rgba(223, 153, 32, 1)",
        data: chartData?.map((item) => calculateActual(item)),
      },
    ],
  };
  return {
    chartDataResult,
    fullData,
    title,
    dropZeroSubDivIndex: [],
  };
};

export default function BudgetToActualCharts(props: Props) {
  const {
    formData,
    clickedLink,
    dummyForceRender,
    anchorScrollElement,
    projectId,
    filterZeroElements,
  } = props;
  // const [chartDataIndex, setChartDataIndex] = useState<
  //   | {
  //       title: string;
  //       division: string;
  //       subDivision: string | null;
  //       fullData: DivisionData;
  //       dropZeroSubDivIndex: number[];
  //       chartData: {
  //         labels: string[];
  //         datasets: {
  //           label: string;
  //           data: number[];
  //           backgroundColor: string;
  //         }[];
  //       };
  //     }[]
  //   | null
  // >(null);

  const [chartData, setChartData] = useState<
    | {
        title: string;
        division: string;
        subDivision: string | null;
        fullData: DivisionDataV2;
        dropZeroSubDivIndex: number[];
        chartData: {
          labels: string[];
          datasets: {
            label: string;
            data: number[];
            backgroundColor: string;
          }[];
        };
      }[]
    | null
  >(null);

  // const budgetFormState = useSelector((state) => state.addBudgetForm);

  // grab chart state here
  const b2aChartData = useSelector(
    (state) => state.projects[projectId]?.b2a?.b2aChartData
  );

  console.log("dionY [BudgetToActualCharts] b2aChartData: ", b2aChartData);

  useEffect(() => {
    scrollToElement(clickedLink, anchorScrollElement, "scroll-frame");
  }, [clickedLink, dummyForceRender]);

  useEffect(() => {
    let chartIndicies: {
      title: string;
      division: string;
      subDivision: string | null;
      fullData: DivisionDataV2;
      dropZeroSubDivIndex: number[];
      chartData: {
        labels: string[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor: string;
        }[];
      };
    }[] = [];

    (
      (b2aChartData as ChartDataV2)?.divisions ||
      (formData.divisions as DivisionDataV2[])
    )?.forEach((division) => {
      const { chartDataResult, fullData, title, dropZeroSubDivIndex } =
        createIndividualChartData({
          title: division.name,
          division: division.number,
          subDivision: null,
          chartData: division.subItems,
          filterZeroElements: filterZeroElements,
        });

      chartIndicies.push({
        title,
        division: String(division.number),
        subDivision: null,
        chartData: chartDataResult,
        fullData: division,
        dropZeroSubDivIndex,
      });
    });

    console.log("formdata: ", formData, chartIndicies);
    setChartData(chartIndicies);
  }, [b2aChartData, formData]);

  // useEffect(() => {
  //   let chartIndicies: {
  //     title: string;
  //     division: string;
  //     subDivision: string | null;
  //     fullData: DivisionData;
  //     dropZeroSubDivIndex: number[];
  //     chartData: {
  //       labels: string[];
  //       datasets: {
  //         label: string;
  //         data: number[];
  //         backgroundColor: string;
  //       }[];
  //     };
  //   }[] = [];

  //   // Hardcode the "_" for the subdivision that we always know should be skipped and
  //   // only display the division and the cost codes.
  //   Object.keys(budgetFormState.totalDivisions).forEach((division) => {
  //     if (!b2aChartData) return;
  //     {
  //       const { chartDataResult, fullData, title, dropZeroSubDivIndex } =
  //         +division !== 0
  //           ? createIndividualChartData({
  //               division: +(division as string),
  //               subDivision: null,
  //               chartData: b2aChartData,
  //               filterZeroElements: filterZeroElements,
  //             })
  //           : createIndividualChartData({
  //               division: +(division as string),
  //               subDivision: null,
  //               subDivisionName: "_",
  //               chartData: b2aChartData,
  //               filterZeroElements: filterZeroElements,
  //             });
  //       chartIndicies.push({
  //         title,
  //         division,
  //         subDivision: null,
  //         chartData: chartDataResult,
  //         fullData,
  //         dropZeroSubDivIndex,
  //       });
  //     }
  //   });
  //   console.log(
  //     "chartIndicies: ",
  //     budgetFormState,
  //     b2aChartData,
  //     chartIndicies
  //   );
  //   setChartDataIndex(chartIndicies);
  // }, [b2aChartData]);

  // const handleClick = (
  //   subDivNumber: string | null | undefined,
  //   division: string,
  //   subDivName: string | null
  // ) => {
  //   // Handle the click event
  //   // set a state for the current chart data for that chart, and the click
  //   // will update the state re-rendering that individual chart.
  //   // have to be an array for all charts
  //   if (subDivName === "_" || !b2aChartData) return;
  //   setChartDataIndex((prevState) => {
  //     if (prevState) {
  //       const updatedChartArray = [...prevState];
  //       const updatedChartElement = updatedChartArray.find(
  //         (element) => (element.division as string) === division
  //       );
  //       if (updatedChartElement && subDivNumber) {
  //         const { chartDataResult, title } = createIndividualChartData({
  //           division: +(division as string),
  //           subDivision: +(subDivNumber as string),
  //           chartData: b2aChartData,
  //           filterZeroElements: filterZeroElements,
  //         });
  //         updatedChartElement.subDivision = subDivNumber;
  //         updatedChartElement.title = `${updatedChartElement.title} / ${title}`;
  //         updatedChartElement.chartData = chartDataResult;
  //       } else if (
  //         updatedChartElement &&
  //         (subDivNumber === undefined || subDivNumber === null)
  //       ) {
  //         const { chartDataResult, title } = createIndividualChartData({
  //           division: +(division as string),
  //           subDivision: null,
  //           chartData: b2aChartData,
  //           filterZeroElements: filterZeroElements,
  //         });
  //         updatedChartElement.subDivision = null;
  //         updatedChartElement.title = title;
  //         updatedChartElement.chartData = chartDataResult;
  //       }
  //       return updatedChartArray;
  //     }
  //     return prevState;
  //   });
  // };

  // const createIndividualChartData = ({
  //   division,
  //   subDivision,
  //   subDivisionName,
  //   chartData,
  //   filterZeroElements,
  // }: {
  //   division: number;
  //   subDivision?: number | null;
  //   subDivisionName?: string;
  //   chartData: ChartData;
  //   filterZeroElements?: boolean;
  // }) => {
  //   console.log("createIndividualChartData start--------------------------");
  //   console.log("chartData:", chartData, chartData[division]);
  //   const getKeyById = (object: { [id: number]: any }, value: string) => {
  //     for (const [key, val] of Object.entries(object)) {
  //       if (val.subDivisionName === value) {
  //         return key;
  //       }
  //     }
  //     return null;
  //   };

  //   // Check if the subdivision name is "_" which tells the software to skip that
  //   // subdiv and go straight to the cost codes
  //   const subDivisionUpdated =
  //     subDivisionName === "_"
  //       ? +(getKeyById(chartData[division].subDivisions, "_") as string)
  //       : subDivision;
  //   console.log("subDivisionUpdated1: ", subDivisionUpdated);

  //   const title: string =
  //     subDivision && subDivisionName !== "_"
  //       ? `${subDivision.toFixed(1)} - ${
  //           chartData[division].subDivisions[subDivision].subDivisionName
  //         }`
  //       : division.toString().padStart(2, "0") != "00"
  //       ? `${division.toString().padStart(2, "0")} - ${
  //           chartData[division].divisionName
  //         }`
  //       : `${chartData[division].divisionName}`;
  //   console.log("title: ", title);

  //   const fullData: DivisionData = chartData[division];

  //   let dropZeroSubDivIndex: number[] = [];
  //   chartData[division].subDivisionLabels.forEach((_, index) => {
  //     if (
  //       chartData[division].subDivisionActuals[index] == 0 &&
  //       chartData[division].subDivisionTotals[index] == 0
  //     ) {
  //       dropZeroSubDivIndex.push(index);
  //     }
  //   });
  //   console.log("dropZeroSubDivIndex: ", dropZeroSubDivIndex);

  //   let dropZeroCostCodeIndex: number[] = [];
  //   if (subDivisionUpdated) {
  //     chartData[division].subDivisions[subDivisionUpdated].costCodeLabels.map(
  //       (_, index) => {
  //         if (
  //           chartData[division].subDivisions[subDivisionUpdated]
  //             .costCodeActuals[index] == 0 &&
  //           chartData[division].subDivisions[subDivisionUpdated].costCodeTotals[
  //             index
  //           ] == 0
  //         ) {
  //           dropZeroCostCodeIndex.push(index);
  //         }
  //       }
  //     );
  //   }
  //   console.log("dropZeroCostCodeIndex: ", dropZeroCostCodeIndex);

  //   console.log("subDivisionUpdated: ", subDivisionUpdated);

  //   const chartDataResult = subDivisionUpdated
  //     ? {
  //         labels: filterZeroElements
  //           ? chartData[division].subDivisions[
  //               subDivisionUpdated
  //             ].costCodeLabels
  //               .map((label, index) => {
  //                 return `${(+chartData[division].subDivisions[
  //                   subDivisionUpdated
  //                 ].costCodeNumbers[index]).toFixed(4)} - ${label}`;
  //               })
  //               .filter((_, index) => !dropZeroCostCodeIndex.includes(index))
  //           : chartData[division].subDivisions[
  //               subDivisionUpdated
  //             ].costCodeLabels.map((label, index) => {
  //               return `${(+chartData[division].subDivisions[subDivisionUpdated]
  //                 .costCodeNumbers[index]).toFixed(4)} - ${label}`;
  //             }),
  //         datasets: [
  //           {
  //             label: "Budget",
  //             data: filterZeroElements
  //               ? chartData[division].subDivisions[
  //                   subDivisionUpdated
  //                 ].costCodeTotals.filter(
  //                   (_, index) => !dropZeroCostCodeIndex.includes(index)
  //                 )
  //               : chartData[division].subDivisions[subDivisionUpdated]
  //                   .costCodeTotals,
  //             backgroundColor: "rgba(86, 144, 146, 1)",
  //           },
  //           {
  //             label: "Actual",
  //             data: filterZeroElements
  //               ? chartData[division].subDivisions[
  //                   subDivisionUpdated
  //                 ].costCodeActuals.filter(
  //                   (_, index) => !dropZeroCostCodeIndex.includes(index)
  //                 )
  //               : chartData[division].subDivisions[subDivisionUpdated]
  //                   .costCodeActuals,
  //             backgroundColor: "rgba(223, 153, 32, 1)",
  //           },
  //         ],
  //       }
  //     : {
  //         labels: filterZeroElements
  //           ? chartData[division].subDivisionLabels
  //               .map((label, index) => {
  //                 return `${
  //                   Object.keys(chartData[division].subDivisions)[index]
  //                 } - ${label}`;
  //               })
  //               .filter((_, index) => !dropZeroSubDivIndex.includes(index))
  //           : chartData[division].subDivisionLabels.map((label, index) => {
  //               return `${
  //                 Object.keys(chartData[division].subDivisions)[index]
  //               } - ${label}`;
  //             }),
  //         datasets: [
  //           {
  //             label: "Budget",
  //             data: filterZeroElements
  //               ? chartData[division].subDivisionTotals.filter(
  //                   (_, index) => !dropZeroSubDivIndex.includes(index)
  //                 )
  //               : chartData[division].subDivisionTotals,
  //             backgroundColor: "rgba(86, 144, 146, 1)",
  //           },
  //           {
  //             label: "Actual",
  //             data: filterZeroElements
  //               ? chartData[division].subDivisionActuals.filter(
  //                   (_, index) => !dropZeroSubDivIndex.includes(index)
  //                 )
  //               : chartData[division].subDivisionActuals,
  //             backgroundColor: "rgba(223, 153, 32, 1)",
  //           },
  //         ],
  //       };
  //   console.log("formdata: ", chartDataResult);
  //   return { chartDataResult, fullData, title, dropZeroSubDivIndex };
  // };
  return (
    <Card
      className={`${classes["parent-frame"]} ${classes["parent-frame__form"]} bg-stak-white flex flex-col`}
    >
      <div
        className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll gap-8"
        id="scroll-frame"
      >
        {chartData &&
          chartData.map(
            ({
              chartData,
              fullData,
              title,
              division,
              subDivision,
              dropZeroSubDivIndex,
            }) => {
              return (
                <div
                  key={division}
                  className="w-full h-96 px-10"
                  id={formatNameForID(fullData.name)}
                >
                  {(chartData.datasets[0].data?.some((data) => data > 0) ||
                    chartData.datasets[1].data?.some((data) => data > 0)) && (
                    <BarChart
                      title={title}
                      fullData={fullData}
                      data={chartData}
                      minBarWidth={100}
                      division={division as string}
                      subDivision={subDivision}
                      filterZeroElements={filterZeroElements}
                      dropZeroSubDivIndex={dropZeroSubDivIndex}
                    />
                  )}
                  {chartData.datasets[0].data?.every((data) => data === 0) &&
                    chartData.datasets[1].data?.every((data) => data === 0) && (
                      <span className="font-sans text-[24px] font-semibold line-through">
                        {title}
                      </span>
                    )}
                </div>
              );
            }
          )}
        {/* {chartDataIndex &&
          chartDataIndex.map(
            ({
              chartData,
              fullData,
              title,
              division,
              subDivision,
              dropZeroSubDivIndex,
            }) => {
              return (
                <div
                  key={division}
                  className="w-full h-96 px-10"
                  id={formatNameForID(
                    budgetFormState.totalDivisions[division as string].name
                  )}
                >
                  {(chartData.datasets[0].data.some((data) => data > 0) ||
                    chartData.datasets[1].data.some((data) => data > 0)) && (
                    <BarChart
                      onClick={handleClick}
                      title={title}
                      fullData={fullData}
                      data={chartData}
                      minBarWidth={100}
                      division={division as string}
                      subDivision={subDivision}
                      filterZeroElements={filterZeroElements}
                      dropZeroSubDivIndex={dropZeroSubDivIndex}
                    />
                  )}
                  {chartData.datasets[0].data.every((data) => data === 0) &&
                    chartData.datasets[1].data.every((data) => data === 0) && (
                      <span className="font-sans text-[24px] font-semibold line-through">
                        {title}
                      </span>
                    )}
                </div>
              );
            }
          )} */}
      </div>
    </Card>
  );
}
