import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { companyDataActions } from '@/store/company-data-slice';
import {
  changeProjectStatus,
  deleteProjects,
  projectDataActions,
} from '@/store/projects-data-slice';
import { addProjectFormActions } from '@/store/add-project-slice';
import { overlayActions } from '@/store/overlay-control-slice';

import { usePageData } from '@/hooks/use-page-data';
import { useSetStatePath } from '@/hooks/use-setpath';

import { FormStateV2, User } from '@/lib/models/formStateModels';
import { SELECT_MENU_SUPERVISORS } from '@/lib/globals';
import { getActiveProjects } from '@/lib/utility/tableHelpers';
import {
  ProjectSummaryItem,
  ProjectSummary,
} from '@/lib/models/summaryDataModel';

import Card from '@/components/UI/Card';
import SectionHeading from '@/components/UI/SectionHeadings/SectionHeading';
import FullScreenLoader from '@/components/UI/Loaders/FullScreenLoader';
import CheckboxSortHeadingsTable from '@/components/Tables/MainTables/CheckboxSortHeadingsTableWithFilter';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';
import SlideOverlayForm from '@/components/UI/SlideOverlay/SlideOverlayForm';
import { nanoid } from '@/lib/config';
import { createFormDataForSubmit } from '@/lib/utility/submitFormHelpers';
import { ProjectFormData } from '@/lib/models/formDataModel';
import { createSingleProjectSummary } from '@/lib/utility/createSummaryDataHelpers';
import useHttp from '@/hooks/use-http';
import { checkAllFormFields } from '@/lib/validation/formValidation';
import useSetNotification from '@/hooks/use-set-notification';

const tabs = [
  { name: 'Active', keyName: 'active', current: true },
  { name: 'Completed', keyName: 'completed', current: false },
];

const checkboxButtons = [
  { label: 'Change Status', buttonPath: '#' },
  { label: 'Delete', buttonPath: '#' },
];

const tableHeadings = {
  projectName: 'Project Name',
  ownerName: 'Owner Name',
  address: 'Address',
  city: 'City',
  contractAmt: 'Contract Amount ($)',
  projectSuper: 'Project Supervisor',
  estCompletionDate: 'Est. Completion',
};

function Projects() {
  useSetStatePath();
  const {
    data: allProjectSummary,
    isLoading: pageLoading,
  }: { data: ProjectSummary; isLoading: boolean } = usePageData(
    'data',
    'projectsSummary'
  );
  const { user, isLoading: userLoading } = useUser();

  const dispatch = useDispatch();

  const { data: addProjectFormData } = usePageData(
    'data',
    'forms',
    'add-project'
  );

  const [projects, setProjects] = useState<ProjectSummary | undefined | null>(
    null
  );
  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('active');
  const [activeFilter, setActiveFilter] = useState('No Filter');
  const [selected, setSelected] = useState<ProjectSummaryItem[]>([]);
  const [missingInputs, setMissingInputs] = useState<boolean>(false);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const modalMessage =
    'Warning, all project data will be deleted and cannot be recovered. Are you sure you want to delete?';

  const addProjectFormStateData = useSelector((state) => state.addProjectForm);
  const overlayContent = useSelector((state) => state.overlay.projects);

  const { response, successJSON, sendRequest } = useHttp({ isClearData: true });

  useEffect(() => {
    if (!pageLoading) {
      setProjects(allProjectSummary);
    }
  }, [allProjectSummary]);

  const addProjectHandler = () => {
    dispatch(addProjectFormActions.clearFormState());
    dispatch(addProjectFormActions.resetFormValidation());
    dispatch(
      overlayActions.setOverlayContent({
        data: {
          overlayTitle: 'Add Project',
          open: true,
          isSave: true,
        },
        stateKey: 'projects',
      })
    );
    dispatch(
      overlayActions.setCurrentOverlayData({
        data: {
          currentData: null,
          currentId: null,
        },
        stateKey: 'projects',
      })
    );
  };

  const buttonClickHandler = (
    label: string,
    selected: ProjectSummaryItem[]
  ) => {
    setSelected(selected);
    if (label === 'Delete') {
      setOpenModal(true);
    }
    if (label === 'Change Status') {
      const projectIds = selected.map((project) => project.uuid as string);
      if (activeTabKeyName === 'active') {
        dispatch(
          projectDataActions.changeProjectStatus({
            changeStatusTo: false,
            projectIds: projectIds,
          })
        );
        dispatch(
          companyDataActions.changeSummaryProjectStatus({
            changeStatusTo: false,
            projectIds: projectIds,
          })
        );
        dispatch(
          changeProjectStatus({
            companyId: (user as User).user_metadata.companyId as string,
            projectIds: projectIds,
            changeStatusTo: false,
          })
        );
      }
      if (activeTabKeyName === 'completed') {
        dispatch(
          projectDataActions.changeProjectStatus({
            changeStatusTo: true,
            projectIds: projectIds,
          })
        );
        dispatch(
          companyDataActions.changeSummaryProjectStatus({
            changeStatusTo: true,
            projectIds: projectIds,
          })
        );
        dispatch(
          changeProjectStatus({
            companyId: (user as User).user_metadata.companyId as string,
            projectIds: projectIds,
            changeStatusTo: true,
          })
        );
      }
    }
  };

  useSetNotification({
    response,
    successJSON,
    isOverlay: true,
    overlayStateKey: 'projects',
  });

  const submitFormHandler = async (
    e: React.FormEvent,
    formStateData?: FormStateV2
  ) => {
    e.preventDefault();

    const allValid = checkAllFormFields(
      addProjectFormData,
      addProjectFormStateData
    );

    if (!allValid) {
      setMissingInputs(true);
      return;
    }

    setMissingInputs(false);
    dispatch(
      overlayActions.setOverlayContent({
        data: { open: false },
        stateKey: 'projects',
      })
    );

    const projectUUID = overlayContent?.currentId ?? nanoid();

    // create the form data to push to the DB
    const dataToSubmit = createFormDataForSubmit({
      formData: addProjectFormData,
      formStateData: formStateData as FormStateV2,
      isAddProject: true,
      isAddVendor: false,
      isAddLabor: false,
    }) as ProjectFormData;

    dataToSubmit.uuid = projectUUID;

    const summaryProjectData = createSingleProjectSummary(
      dataToSubmit,
      projectUUID
    );

    dispatch(
      companyDataActions.addToProjectsSummaryData({
        [projectUUID]: summaryProjectData,
      })
    );

    dispatch(
      projectDataActions.addNewProject({
        data: dataToSubmit,
        projectId: projectUUID,
      })
    );

    if (!userLoading && user) {
      const requestConfig = {
        url: `/api/${
          (user as User).user_metadata.companyId
        }/projects/add-project`,
        method: 'POST',
        body: JSON.stringify({
          fullData: dataToSubmit,
          summaryData: summaryProjectData,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      };

      await sendRequest({
        requestConfig,
        actions: addProjectFormActions,
        pushPath: `/${(user as User).user_metadata.companyId}/projects`,
      });
    }
  };

  const closeModalHandler = () => {
    setOpenModal(false);
  };

  const confirmModalHandler = () => {
    const projectsToDelete = selected.map((project) => project.uuid as string);

    dispatch(companyDataActions.removeProjectSummary(projectsToDelete));
    dispatch(projectDataActions.removeFullProjectData(projectsToDelete));
    dispatch(
      deleteProjects({
        companyId: (user as User).user_metadata.companyId as string,
        projectsToDelete: projectsToDelete,
      })
    );
  };

  const filteredData = useMemo(() => {
    if (!(projects as ProjectSummary)?.allProjects) return null;
    let filteredData: ProjectSummaryItem[];
    let subFilteredData: ProjectSummaryItem[];
    if (projects) {
      if (activeTabKeyName === 'active') {
        subFilteredData = Object.values(
          getActiveProjects(projects, 'allProjects', true)
        );
        if (activeFilter !== 'No Filter') {
          filteredData = subFilteredData.filter(
            (row) => row.projectSuper === activeFilter
          );
          return filteredData;
        } else {
          filteredData = subFilteredData;
          return filteredData;
        }
      } else if (activeTabKeyName === 'completed') {
        subFilteredData = Object.values(
          getActiveProjects(projects, 'allProjects', false)
        );
        if (activeFilter !== 'No Filter') {
          filteredData = subFilteredData.filter(
            (row) => row.projectSuper === activeFilter
          );
          return filteredData;
        } else {
          filteredData = subFilteredData;
          return filteredData;
        }
      }
    }
  }, [projects, activeFilter, activeTabKeyName]);

  return (
    <>
      {(userLoading || pageLoading) && <FullScreenLoader />}
      {!userLoading && !pageLoading && (
        <>
          <SlideOverlayForm
            formData={addProjectFormData}
            formState={addProjectFormStateData}
            actions={addProjectFormActions}
            showError={missingInputs}
            overlayContent={overlayContent}
            form="addProject"
            overlayStateKey="projects"
            onSubmit={(e) => submitFormHandler(e, addProjectFormStateData)}
          />
          <ModalConfirm
            onCloseModal={closeModalHandler}
            openModal={openModal}
            onConfirm={confirmModalHandler}
            message={modalMessage}
            title="Delete"
          />
          <div className="main-form-tiles">
            <SectionHeading
              tabs={tabs}
              buttons={[
                {
                  label: 'Add Project',
                  onClick: addProjectHandler,
                },
              ]}
              dropdownFilter={{
                label: 'Project Supervisor Filter',
                value: '',
                id: 'project-supervisor-filter',
                required: false,
                'data-testid': 'project-supervisor-filter',
                selectMenuOptions: SELECT_MENU_SUPERVISORS,
                sortBy: 'label',
              }}
              onActiveTab={(activeTabKeyName) =>
                setActiveTabKeyName(activeTabKeyName)
              }
              onFilter={(activeFilter) => setActiveFilter(activeFilter)}
            />
            <div className="content-tiles">
              <Card className="h-full bg-stak-white w-full">
                <div
                  className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
                  id="scroll-frame"
                >
                  <CheckboxSortHeadingsTable
                    headings={tableHeadings}
                    rows={filteredData}
                    activeFilter={activeFilter}
                    activeTabKeyName={activeTabKeyName}
                    filterKey="projectSuper"
                    baseUrl={`/${
                      (user as User).user_metadata.companyId
                    }/projects`}
                    tableType="projects"
                    onButtonClick={buttonClickHandler}
                    checkboxButtons={checkboxButtons}
                    preSortKey="projectName"
                  />
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Projects;
