import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';
import { addLaborFormActions } from '@/store/add-labor-slice';
import { addChangeOrderFormActions } from '@/store/add-change-order';
import { addContractFormActions } from '@/store/add-contract';
import {
  addBudgetFormActions,
  initializeB2AChartDataThunk,
  initializeBudgetThunk,
  initializeBudgetTotalsThunk,
} from '@/store/add-budget-slice';
import { addProjectFormActions } from '@/store/add-project-slice';
import { addVendorFormActions } from '@/store/add-vendor-slice';

import useHttp from '@/hooks/use-http';
import { usePageData } from '@/hooks/use-page-data';
import useLocationChange from '@/hooks/use-location-change';

import { User } from '@/lib/models/formStateModels';
import { ProjectSummary } from '@/lib/models/summaryDataModel';
import { getProjectName } from '@/lib/utility/projectHelpers';
import { ProjectDataItems } from '@/lib/models/projectDataModel';

import ProjectsInvoices from '@/components/Projects/ProjectsInvoices';
import Card from '@/components/UI/Card';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import ProjectsSectionHeading from '@/components/UI/SectionHeadings/ProjectPageSectionHeading';
import ProjectsLaborFees from '@/components/Projects/ProjectsLaborFees';
import ProjectDetails from '@/components/Projects/ProjectDetails';
import ProjectsChangeOrders from '@/components/Projects/ProjectsChangeOrders';
import ProjectsContracts from '@/components/Projects/ProjectsContracts';
import ProjectBudget from '@/components/Projects/ProjectBudget';
import ProjectBudgetToActuals from '@/components/Projects/ProjectBudgetToActuals';
import ModalErrorWrapper from '@/components/UI/Modal/ErrorModalWrapper';
import ProjectsClientBills from '@/components/Projects/ProjectsClientBills';

interface Tab {
  name: string;
  keyName: string;
  current: boolean;
}

const tabs: Tab[] = [
  { name: 'Summary', keyName: 'summary', current: true },
  { name: 'Invoices', keyName: 'invoices', current: false },
  { name: 'Client Bills', keyName: 'clientBills', current: false },
  { name: 'Labor/Fees', keyName: 'labor', current: false },
  { name: 'Change Orders', keyName: 'changeOrders', current: false },
  { name: 'Contracts', keyName: 'contracts', current: false },
  { name: 'Budget to Actuals', keyName: 'b2a', current: false },
  { name: 'Project Budget', keyName: 'budget', current: false },
  { name: 'Project Details', keyName: 'projectDetails', current: false },
];

const ProjectHome = () => {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  const dispatch = useDispatch();

  useLocationChange(addVendorFormActions.clearFormState);
  useLocationChange(addProjectFormActions.clearFormState);

  const { user, isLoading: userLoading } = useUser();

  const { successJSON, sendRequest } = useHttp({ isClearData: false });

  const {
    data: projects,
    isLoading: projectsLoading,
  }: { data: Record<string, ProjectSummary | string>; isLoading: boolean } =
    usePageData('data', 'projectsSummary');

  // got an `undefined` error so the optional chaining here protects against that happening
  const projectBudget = useSelector(
    (state) => state.projects[projectId]?.budget
  );
  const isCollapsed = useSelector((state) => state.addBudgetForm.isCollapsed);
  const isProjectsFetched = useSelector(
    (state) => state.processing.allDataFetched
  );

  const [projectData, setProjectData] = useState<ProjectDataItems | null>(null);
  const [projectDataLoading, setProjectDataLoading] = useState<boolean>(false);
  const [updateProject, setUpdateProject] = useState<boolean>(false);
  const [updateBudget, setUpdateBudget] = useState<boolean>(false);
  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('summary');
  const {
    data,
    isLoading: projectLoading,
  }: { data: ProjectDataItems; isLoading: boolean } = usePageData(
    'projects',
    projectId
  );

  const getInactiveProject = async () => {
    setProjectDataLoading(true);
    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/${projectId}/get-all-project-data`,
        method: 'GET',
        headers: {
          projectId: projectId,
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
      });
      setProjectDataLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
      getInactiveProject();
      setProjectData(JSON.parse(successJSON as string));
    } else {
      setProjectData(data);
      setProjectDataLoading(projectLoading);
    }
  }, [data]);

  // intialize the budget form state and calculate totals when going to a project page
  useEffect(() => {
    if (projectId && isProjectsFetched) {
      dispatch(
        initializeBudgetThunk({
          projectId,
        })
      ).then(() => {
        dispatch(initializeBudgetTotalsThunk()).then(() => {
          dispatch(
            initializeB2AChartDataThunk({
              projectId,
              companyId: (user as User).user_metadata.companyId,
            })
          );
        });
      });
    }
  }, [projectId, isProjectsFetched, projectBudget]);

  // click handlers
  // TODO add a invoiceformoverlay for the contract to edit any issues the model has
  // therefore keept his code even though currently it is not being used
  const contractClickHandler = () => {
    dispatch(addContractFormActions.clearFormState());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Add Contract',
          open: true,
          isSave: true,
        },
        stateKey: 'contracts',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'contracts',
      })
    );
  };

  const addLaborClickHandler = () => {
    dispatch(addLaborFormActions.clearFormState());
    dispatch(addLaborFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Add Labor',
          open: true,
          isSave: true,
        },
        stateKey: 'labor',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'labor',
      })
    );
  };

  const addChangeOrderClickHandler = () => {
    dispatch(addChangeOrderFormActions.clearFormState());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Add Change Order',
          open: true,
          isSave: true,
        },
        stateKey: 'change-orders',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'change-orders',
      })
    );
  };

  const updateProjectHandler = () => {
    setUpdateProject((prevState) => !prevState);
  };

  const updateBudgetHandler = () => {
    setUpdateBudget((prevState) => !prevState);
  };

  const collapseBudgetHandler = () => {
    dispatch(addBudgetFormActions.setCollapse(!isCollapsed));
  };
  return (
    <>
      <ModalErrorWrapper />
      {projectsLoading && <FullScreenLoader />}
      {!projectsLoading && (
        <div className="main-form-tiles">
          <ProjectsSectionHeading
            pageTitle={getProjectName(projects, projectId)}
            projectId={projectId}
            tabs={tabs}
            buttons={[
              {
                label: 'Add Labor/Fees',
                isShowingKeyName: 'labor',
                onClick: addLaborClickHandler,
              },
              {
                label: 'Add Change Order',
                disabled: false,
                isShowingKeyName: 'changeOrders',
                onClick: addChangeOrderClickHandler,
              },
              {
                label: 'Add Contracts',
                disabled: false,
                isShowingKeyName: 'contracts',
              },
              {
                label: 'Update Project Details',
                disabled: false,
                isShowingKeyName: 'projectDetails',
                onClick: updateProjectHandler,
              },
              {
                label: 'Update Budget',
                isShowingKeyName: 'budget',
                onClick: updateBudgetHandler,
              },
              {
                label: `${isCollapsed ? 'Expand' : 'Collapse'} Budget`,
                isShowingKeyName: 'budget',
                onClick: collapseBudgetHandler,
              },
            ]}
            onActiveTab={setActiveTabKeyName}
          />
          <div className="content-tiles shadow-none">
            {activeTabKeyName !== 'projectDetails' &&
              activeTabKeyName !== 'changeOrders' &&
              activeTabKeyName !== 'budget' &&
              activeTabKeyName !== 'b2a' && (
                <Card
                  className={`h-full max-h-full w-full ${
                    activeTabKeyName !== 'projectDetails' &&
                    activeTabKeyName !== 'changeOrders'
                      ? 'bg-stak-white'
                      : 'shadow'
                  }`}
                >
                  <div
                    className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
                    id="scroll-frame"
                  >
                    {projectDataLoading && <FullScreenLoader />}
                    {activeTabKeyName === 'invoices' &&
                      !projectDataLoading &&
                      !projectsLoading && (
                        <ProjectsInvoices
                          projectId={projectId}
                          projects={projects}
                          contractData={
                            projectData ? projectData['contracts'] : null
                          }
                        />
                      )}
                    {activeTabKeyName === 'clientBills' &&
                      !projectDataLoading &&
                      !projectsLoading && (
                        <ProjectsClientBills projectId={projectId} />
                      )}
                    {activeTabKeyName === 'labor' && !projectDataLoading && (
                      <ProjectsLaborFees
                        projectId={projectId}
                        tableData={
                          projectData ? projectData['labor-summary'] : null
                        }
                      />
                    )}
                    {activeTabKeyName === 'contracts' &&
                      !projectDataLoading && (
                        <ProjectsContracts
                          projectId={projectId}
                          tableData={
                            projectData ? projectData['contracts'] : null
                          }
                        />
                      )}
                  </div>
                </Card>
              )}
            {activeTabKeyName === 'projectDetails' && !projectDataLoading && (
              <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch">
                <ProjectDetails
                  projectId={projectId}
                  updateProject={updateProject}
                  onUpdateProjectClick={updateProjectHandler}
                />
              </div>
            )}
            {activeTabKeyName === 'changeOrders' && !projectDataLoading && (
              <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch">
                <ProjectsChangeOrders
                  projectId={projectId}
                  tableData={
                    projectData ? projectData['change-orders-summary'] : null
                  }
                />
              </div>
            )}
            {activeTabKeyName === 'budget' && !projectDataLoading && (
              <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch">
                <ProjectBudget
                  updateBudget={updateBudget}
                  projectId={projectId}
                  onUpdateBudgetClick={updateBudgetHandler}
                />
              </div>
            )}
            {activeTabKeyName === 'b2a' && !projectDataLoading && (
              <div className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch">
                <ProjectBudgetToActuals projectId={projectId} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectHome;
