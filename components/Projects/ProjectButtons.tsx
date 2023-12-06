import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';

import {
  createBudgetActuals,
  moveAllBillData,
  moveBillDataInFirestore,
} from '@/store/add-client-bill';

import { User } from '@/lib/models/formStateModels';
import { getAPIUrl, nanoid } from '@/lib/config';

import {
  CostCodeItem,
  CurrentActualsChangeOrdersV2,
  CurrentActualsV2,
  Divisions,
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
  ReportData,
} from '@/lib/models/budgetCostCodeModel';
import ButtonWithLoader from '../UI/Buttons/ButtonWithLoader';
import { uiActions } from '@/store/ui-slice';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import {
  getDataByRecursiveLevel,
  iterateData,
} from '@/lib/utility/costCodeHelpers';
import { SUMMARY_COST_CODES } from '@/lib/globals';
import { ClientBillSummary } from '@/lib/models/summaryDataModel';
import DropDownButton from '../UI/Buttons/DropDownButton';

interface Props {
  projectId: string;
  clientBillId?: string;
  isClientBillPage?: boolean;
}

const ProjectButtons = (props: Props) => {
  const reportTaskId = 'Build_Report';

  const { projectId, clientBillId, isClientBillPage } = props;
  const dispatch = useDispatch();
  const { user } = useUser();

  const projectBudget = useSelector(
    (state) => state.projects[projectId]?.budget
  );

  const clientBills = useSelector(
    (state) => state.projects[projectId]?.['client-bills-summary']
  ) as ClientBillSummary;

  const buildClientBillHandler = () => {
    const clientBillId = nanoid();
    // There are checks in each of these dispatches that will end the dispatch early,
    // so each subsequent dispatch should not run unless the previous one completed
    // successfully
    dispatch(
      createBudgetActuals({
        projectId,
        companyId: (user as User).user_metadata.companyId,
        clientBillId,
      })
    ).then((result) => {
      if (result.payload) {
        const { clientBillObj } = result.payload as {
          clientBillObj: {
            actuals: InvoiceCurrentActualsV2;
            actualsChangeOrders: InvoiceCurrentActualsChangeOrdersV2;
          };
        };
        dispatch(
          moveAllBillData({
            projectId,
            clientBillId,
          })
        ).then(() =>
          dispatch(
            moveBillDataInFirestore({
              projectId,
              companyId: (user as User).user_metadata.companyId,
              clientBillId,
              clientBillObj,
            })
          )
        );
      }
    });
    dispatch(uiActions.setLoadingState({ isLoading: true }));
  };

  const buildB2AReportAsPDF = () => {
    buildB2AReport();
  };

  const buildB2AReportAsExcel = () => {
    buildB2AReport();
  };

  const buildB2AReport = async () => {
    if (!clientBillId || !clientBills) return;
    dispatch(
      uiActions.setTaskLoadingState({
        taskId: reportTaskId,
        isLoading: true,
      })
    );
    try {
      const clientBillActuals: {
        [clientBillId: string]: {
          currentActuals: CurrentActualsV2;
          currentActualsChangeOrders: CurrentActualsChangeOrdersV2;
        };
      } = {};

      // fetch current and previous client bill data from backend
      const clientBillIds = Object.keys(clientBills).filter(
        (key) =>
          key === clientBillId ||
          new Date(clientBills[clientBillId].createdAt || 0) >=
            new Date(clientBills[key].createdAt || 0)
      );
      for (const clientBillId of clientBillIds) {
        const result = await fetchWithRetry(
          `/api/${
            (user as User).user_metadata.companyId
          }/projects/${projectId}/get-single-client-bill`,
          {
            method: 'GET',
            headers: {
              clientBillId,
              isOnlyCurrentActuals: 'false',
            },
          }
        );
        const data = JSON.parse(result)[clientBillId]['current-actuals'];
        const { currentActuals, currentActualsChangeOrders } = data;
        clientBillActuals[clientBillId] = {
          currentActuals: currentActuals as CurrentActualsV2,
          currentActualsChangeOrders:
            currentActualsChangeOrders as CurrentActualsChangeOrdersV2,
        };
      }

      const reportData: ReportData = {};

      const initReportData = (
        item: CostCodeItem | Divisions,
        level: Array<number>,
        hasSubItem = false
      ) => {
        const depth = level.length - 1;
        reportData[item.number] = {
          title: `${'  '.repeat(depth)}${item.number} ${item.name}`,
          budgetAmount: (item as CostCodeItem).value || '',
          actualAmount: '',
          difference: '',
          percent: '',
          costCode: item.number,
          hasSubItem,
        };
      };

      projectBudget &&
        projectBudget.divisions.forEach((div, index) => {
          iterateData({
            data: div,
            level: [index],
            cb: initReportData,
            visitAll: true,
          });
        });

      // fetch actual amounts from invoices
      Object.keys(clientBillActuals).forEach((clientBillId: any) => {
        const billData = clientBillActuals[clientBillId];

        // for now, skip tax information
        Object.keys(billData.currentActuals)
          .filter(
            (key) =>
              Object.values(SUMMARY_COST_CODES).findIndex(
                (item) => item === key
              ) === -1
          )
          .forEach((key) => {
            const data = billData.currentActuals[key];

            const result = getDataByRecursiveLevel({
              fullData: projectBudget.divisions,
              level: data.recursiveLevel || [],
            });

            if (result && result.data && reportData[result.data.number]) {
              reportData[result.data.number] = {
                ...reportData[result.data.number],
                actualAmount:
                  Number(reportData[result.data.number].actualAmount) +
                  Number(data.totalAmt.replaceAll(',', '')),
              };
            }
          });
      });

      const finalReportData = Object.values(reportData)
        .map((data) => ({
          title: data.title,
          budgetAmount: data.hasSubItem
            ? ''
            : Number(data.budgetAmount).toFixed(2),
          actualAmount: data.hasSubItem
            ? ''
            : Number(data.actualAmount).toFixed(2),
          difference: data.hasSubItem
            ? ''
            : (Number(data.actualAmount) - Number(data.budgetAmount)).toFixed(
                2
              ),
          percent: data.hasSubItem
            ? ''
            : `${(Number(data.budgetAmount) !== 0
                ? (Number(data.actualAmount) / Number(data.budgetAmount)) * 100
                : 0
              ).toFixed(2)}%`,
          costCode: data.costCode,
        }))
        .sort((a, b) => {
          if (Number(a.costCode) > Number(b.costCode)) return 1;
          return -1;
        });

      const result = await fetchWithRetry(
        `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/build-b2a-report`,
        {
          method: 'POST',
          body: JSON.stringify(finalReportData),
        }
      );
      dispatch(
        uiActions.notify({
          content: 'Successfully built b2a report.',
          icon: 'success',
        })
      );

      fetch(`${getAPIUrl()}/static/${result.download_url}`)
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', result.download_url);
          document.body.appendChild(link);
          link.click();
        });
    } catch (error) {
      console.error(error);
      dispatch(
        uiActions.notify({
          content: 'Error when trying to build b2a report.',
          icon: 'error',
        })
      );
      return false;
    } finally {
      dispatch(
        uiActions.setTaskLoadingState({
          taskId: reportTaskId,
          isLoading: false,
        })
      );
    }
  };

  return (
    <div className="flex gap-2">
      {isClientBillPage ? (
        <DropDownButton
          dropDownButton={{
            label: 'Build B2A Report',
            items: [
              {
                label: 'Export as PDF',
                onClick: buildB2AReportAsPDF,
              },
              {
                label: 'Export as Excel',
                onClick: buildB2AReportAsExcel,
              },
            ],
          }}
          taskId={reportTaskId}
        />
      ) : (
        <ButtonWithLoader
          button={{
            label: "Build Client's Bill",
            className:
              'px-10 py-2 md:text-2xl font-normal bg-stak-dark-green 2xl:text-3xl',
            onClick: buildClientBillHandler,
          }}
        />
      )}
    </div>
  );
};

export default ProjectButtons;
