import { useEffect, useState } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { formatNameForID } from '@/lib/utility/formatter';
import scrollToElement from '@/lib/utility/scrollToElement';

import classes from '../Forms/InputFormLayout/FormLayout.module.css';
import BarChart from './BarChart';
import Card from '../UI/Card';
import {
  ChartDataV2,
  CostCodeItemB2AData,
  DivisionDataV2,
} from '@/lib/models/chartDataModels';
import { CostCodesData } from '@/lib/models/budgetCostCodeModel';

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
  if (data.subItems && data.subItems?.length > 0) {
    data.subItems.forEach((item) => (total += calculateCostCode(item)));
  } else if (data.value) {
    // TODO should check with isCurrency property
    total = Number(data.value);
  }
  return total;
};

export const calculateActual = (data: CostCodeItemB2AData) => {
  let total = 0;
  if (data.subItems && data.subItems?.length > 0) {
    data.subItems.forEach((item) => (total += calculateActual(item)));
  } else if (data.actual) {
    // TODO should check with isCurrency property
    total = Number(data.actual) || 0;
  }
  return total;
};

export const createIndividualChartData = ({
  title: _title,
  division,
  chartData,
}: {
  title: string;
  division: number;
  subDivision?: number | null;
  subDivisionName?: string;
  chartData?: CostCodeItemB2AData[];
  filterZeroElements?: boolean;
}) => {
  const title = `${division} - ${_title}`;
  const fullData = chartData || [];
  const chartDataResult = {
    labels: chartData?.map((item) => `${item.number} - ${item.name}`) || [],
    datasets: [
      {
        label: 'Budget',
        backgroundColor: 'rgba(86, 144, 146, 1)',
        data: chartData?.map((item) => calculateCostCode(item)) || [],
      },
      {
        label: 'Actual',
        backgroundColor: 'rgba(223, 153, 32, 1)',
        data: chartData?.map((item) => calculateActual(item)) || [],
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

  // grab chart state here
  const b2aChartData = useSelector(
    (state) => state.projects[projectId]?.b2a?.b2aChartData
  );

  useEffect(() => {
    scrollToElement(clickedLink, anchorScrollElement, 'scroll-frame');
  }, [clickedLink, dummyForceRender]);

  useEffect(() => {
    const chartIndicies: {
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
      const { chartDataResult, title, dropZeroSubDivIndex } =
        createIndividualChartData({
          title: division.name || '',
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

    setChartData(chartIndicies);
  }, [b2aChartData, formData]);

  return (
    <Card
      className={`${classes['parent-frame']} ${classes['parent-frame__form']} bg-stak-white flex flex-col`}
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
                  id={formatNameForID(fullData?.name || '')}
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
      </div>
    </Card>
  );
}
