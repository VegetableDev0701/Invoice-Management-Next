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
  B2AReport,
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
} from '@/lib/models/budgetCostCodeModel';
import ButtonWithLoader from '../UI/Buttons/ButtonWithLoader';
import { uiActions } from '@/store/ui-slice';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import {
  ChangeOrderSummary,
  ClientBillSummary,
  ProjectSummary,
  ProjectSummaryItem,
} from '@/lib/models/summaryDataModel';
import DropDownButton from '../UI/Buttons/DropDownButton';
import { buildB2AReport } from '@/lib/utility/budgetReportHelpers';
import ClientBillListModal from '../Budget/ClientBill/ClientBillListModal';
import { useState } from 'react';

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

  const changeOrderSummary = useSelector(
    (state) => state.projects[projectId]?.['change-orders-summary']
  ) as ChangeOrderSummary;

  const projectSummary = useSelector(
    (state) =>
      (state.data.projectsSummary.allProjects as ProjectSummary)[projectId]
  ) as ProjectSummaryItem;

  const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState('');

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

  const saveAsExcel = async ({ b2aReport }: { b2aReport: B2AReport }) => {
    const result = await fetchWithRetry(
      `/api/${
        (user as User).user_metadata.companyId
      }/projects/${projectId}/build-b2a-report`,
      {
        method: 'POST',
        body: JSON.stringify(b2aReport),
      }
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
  };

  const saveAsPDF = async ({
    b2aReport,
    title,
  }: {
    b2aReport: B2AReport;
    title: string;
  }) => {
    const { renderPDF } = await import('@/components/PDF/B2AReport');
    const url = window.URL.createObjectURL(
      await renderPDF({
        b2aReport: b2aReport,
        billTitle: title,
      })
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${
        new Date()
          .toISOString()
          .replace('T', '_')
          .replace(':', '-')
          .split('.')[0]
      }.pdf`
    );
    document.body.appendChild(link);
    link.click();
  };

  const handleBuildB2AReport = async (clientBillIds: string[]) => {
    setOpenConfirmModal(false);
    if (!clientBillId || !clientBillIds || !clientBillIds.length) return;
    dispatch(
      uiActions.setTaskLoadingState({
        taskId: reportTaskId,
        isLoading: true,
      })
    );
    try {
      const b2aReport = await buildB2AReport({
        clientBillIds,
        projectId,
        projectBudget,
        changeOrderSummary,
        companyId: (user as User).user_metadata.companyId,
        projectSummary,
      });

      if (reportType === 'pdf')
        await saveAsPDF({
          b2aReport,
          title: clientBills[clientBillId].billTitle,
        });
      else if (reportType === 'excel') {
        await saveAsExcel({
          b2aReport,
        });
      }

      dispatch(
        uiActions.notify({
          content: 'Successfully built b2a report.',
          icon: 'success',
        })
      );
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

  const buildB2AReportAsPDF = () => {
    setReportType('pdf');
    setOpenConfirmModal(true);
  };

  const buildB2AReportAsExcel = () => {
    setReportType('excel');
    setOpenConfirmModal(true);
  };

  return (
    <div className="flex gap-2">
      {isClientBillPage && clientBillId ? (
        <>
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
          <ClientBillListModal
            clientBillId={clientBillId}
            projectId={projectId}
            openModal={openConfirmModal}
            onCloseModal={() => setOpenConfirmModal(false)}
            onConfirm={handleBuildB2AReport}
          />
        </>
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
