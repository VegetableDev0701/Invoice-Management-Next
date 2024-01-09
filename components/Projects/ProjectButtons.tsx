import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import {
  createBudgetActuals,
  moveAllBillData,
  moveBillDataInFirestore,
} from '@/store/add-client-bill';
import { projectDataActions } from '@/store/projects-data-slice';
import { addBillTitleActions } from '@/store/add-bill-title-slice';
import { uiActions } from '@/store/ui-slice';

import { User } from '@/lib/models/formStateModels';
import { getAPIUrl, nanoid } from '@/lib/config';
import {
  InvoiceCurrentActualsChangeOrdersV2,
  InvoiceCurrentActualsV2,
} from '@/lib/models/budgetCostCodeModel';
import ButtonWithLoader from '../UI/Buttons/ButtonWithLoader';
import { fetchWithRetry } from '@/lib/utility/ioUtils';
import {
  ChangeOrderSummary,
  ClientBillSummary,
  ProjectSummary,
  ProjectSummaryItem,
} from '@/lib/models/summaryDataModel';
import { getMonthNumber } from '@/lib/utility/utils';
import { buildB2AReport } from '@/lib/utility/budgetReportHelpers';

import DropDownButton from '../UI/Buttons/DropDownButton';
import ModalForm from '../UI/Modal/ModalForm';


interface Props {
  projectId: string;
  clientBillId?: string;
  isClientBillPage?: boolean;
}

const ProjectButtons = (props: Props) => {
  const reportTaskId = 'Build_Report';
  const buildTask = 'Build_Client_Bill';

  const { projectId, clientBillId, isClientBillPage } = props;
  const dispatch = useDispatch();
  const { user } = useUser();

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [newClientBillId, setNewClientBillId] = useState<string>('');

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

  const addBillTitleFormState = useSelector((state) => state.addBillTitleForm);
  const addBillTitleFormData = useSelector(
    (state) => state.data.forms['bill-title']
  );

  const confirmModalHandler = () => {
    const newClientBillSummary = clientBills[newClientBillId];
    const billMonthName = addBillTitleFormState['bill-month'].value as string;
    const billYear = addBillTitleFormState['bill-year'].value;
    const monthNumber = (getMonthNumber(billMonthName) + 1)
      .toString()
      .padStart(2, '0');

    const updatedClientBillSummary = {
      ...newClientBillSummary,
      billTitle: `${billYear}-${monthNumber} (${billMonthName})`,
    };

    dispatch(
      projectDataActions.addSummaryTableRow({
        newData: updatedClientBillSummary,
        projectId,
        stateKey: 'client-bills-summary',
      })
    );
    setOpenModal(false);
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const buildClientBillHandler = () => {
    dispatch(
      uiActions.setTaskLoadingState({
        taskId: buildTask,
        isLoading: true,
      })
    );
    dispatch(uiActions.lockUI());
    const clientBillId = nanoid();
    setNewClientBillId(clientBillId);
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
        )
          .then(() =>
            dispatch(
              moveBillDataInFirestore({
                projectId,
                companyId: (user as User).user_metadata.companyId,
                clientBillId,
                clientBillObj,
              })
            )
          )
          .then((result) => {
            if (
              (result.payload as { isSuccess: boolean; error: any }).isSuccess
            ) {
              dispatch(
                uiActions.notify({
                  content: 'Successfully added and saved new client bill.',
                  icon: 'success',
                })
              );
              setOpenModal(true);
            } else {
              dispatch(
                uiActions.notify({
                  content: (
                    result.payload as { isSuccess: boolean; error: any }
                  ).error.message,
                  icon: 'error',
                  autoHideDuration: 4000,
                })
              );
              dispatch(
                projectDataActions.removeClientBillSummary({
                  projectId,
                  rowId: clientBillId,
                })
              );
            }
            dispatch(
              uiActions.setTaskLoadingState({
                taskId: buildTask,
                isLoading: false,
              })
            );
            dispatch(uiActions.unLockUI());
          });
      } else {
        dispatch(
          uiActions.setTaskLoadingState({
            taskId: buildTask,
            isLoading: false,
          })
        );
        dispatch(uiActions.unLockUI());
      }
    });
  };

  const buildB2AReportAsPDF = async () => {
    if (!clientBillId || !clientBills) return;
    dispatch(
      uiActions.setTaskLoadingState({
        taskId: reportTaskId,
        isLoading: true,
      })
    );
    try {
      const b2aReport = await buildB2AReport({
        clientBillId,
        clientBills,
        projectId,
        projectBudget,
        changeOrderSummary,
        companyId: (user as User).user_metadata.companyId,
        projectSummary,
      });

      const { renderPDF } = await import('@/components/PDF/B2AReport');
      const url = window.URL.createObjectURL(
        await renderPDF({
          b2aReport: b2aReport,
          billTitle: clientBills[clientBillId].billTitle,
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

  const buildB2AReportAsExcel = async () => {
    if (!clientBillId || !clientBills) return;
    dispatch(
      uiActions.setTaskLoadingState({
        taskId: reportTaskId,
        isLoading: true,
      })
    );
    try {
      const reportData = await buildB2AReport({
        clientBillId,
        clientBills,
        projectId,
        projectBudget,
        changeOrderSummary,
        companyId: (user as User).user_metadata.companyId,
        projectSummary,
      });
      const result = await fetchWithRetry(
        `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/build-b2a-report`,
        {
          method: 'POST',
          body: JSON.stringify(reportData),
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
    <>
      <ModalForm
        onCloseModal={closeModalHandler}
        onConfirm={confirmModalHandler}
        openModal={openModal}
        buttonText="Finish"
        formData={addBillTitleFormData}
        formState={addBillTitleFormState}
        actions={addBillTitleActions}
        form="addBillTitle"
        title="Bill Title"
      />
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
            taskId={buildTask}
          />
        )}
      </div>
    </>
  );
};

export default ProjectButtons;
