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
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';
import { generateTitle } from '@/lib/utility/utils';

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
  chartData?: CostCodeItemB2AData[];
  filterZeroElements?: boolean;
}) => {
  const title = generateTitle(division, _title);
  const fullData = chartData || [];
  const chartDataResult = {
    labels:
      chartData?.map((item) => generateTitle(item.number, item.name)) || [],
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

  const b2aChartDataChangeOrder = useSelector(
    (state) => state.projects[projectId]?.b2a?.b2aChartDataChangeOrder
  );

  const changeOrdersSummary: ChangeOrderSummary = useSelector(
    (state) => state.projects[projectId]?.['change-orders-summary']
  ) as ChangeOrderSummary;

  useEffect(() => {
    scrollToElement(clickedLink, anchorScrollElement, 'scroll-frame');
  }, [clickedLink, dummyForceRender]);

  useEffect(() => {
    const chartIndices: {
      title: string;
      division: string;
      subDivision: string | null;
      fullData: DivisionDataV2;
      chartData: {
        labels: string[];
        datasets: {
          label: string;
          data: number[];
          backgroundColor: string;
        }[];
      };
    }[] = [];

    if (b2aChartDataChangeOrder) {
      const data = {
        name: 'Change Order Plot',
        number: -1,
        subItems: Object.keys(b2aChartDataChangeOrder).map((key) => ({
          name: changeOrdersSummary[key].name,
          number: -1,
          value: String(b2aChartDataChangeOrder[key].totalValue),
          actual: String(b2aChartDataChangeOrder[key].actualValue),
          isCurrency: true,
        })),
      };

      const { chartDataResult, title } = createIndividualChartData({
        title: data.name,
        division: data.number,
        chartData: data.subItems,
        filterZeroElements,
      });

      chartIndices.push({
        title,
        division: String(data.number),
        subDivision: null,
        chartData: chartDataResult,
        fullData: data,
      });
    }

    (
      (b2aChartData as ChartDataV2)?.divisions ||
      (formData.divisions as DivisionDataV2[])
    )?.forEach((division) => {
      const { chartDataResult, title } = createIndividualChartData({
        title: division.name || '',
        division: division.number,
        chartData: division.subItems,
        filterZeroElements,
      });

      chartIndices.push({
        title,
        division: String(division.number),
        subDivision: null,
        chartData: chartDataResult,
        fullData: division,
      });
    });

    setChartData(chartIndices);
  }, [b2aChartData, b2aChartDataChangeOrder, formData]);

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
            ({ chartData, fullData, title, division, subDivision }) => {
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
