import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import { useAppDispatch as useDispatch } from '@/store/hooks';
import { companyDataActions } from '@/store/company-data-slice';
import {
  changeProjectStatus,
  deleteProjects,
  projectDataActions,
} from '@/store/projects-data-slice';

import { usePageData } from '@/hooks/use-page-data';
import { useSetStatePath } from '@/hooks/use-setpath';

import { User } from '@/lib/models/formStateModels';
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

  const [projects, setProjects] = useState<ProjectSummary | undefined | null>(
    null
  );
  const [activeTabKeyName, setActiveTabKeyName] = useState<string>('active');
  const [activeFilter, setActiveFilter] = useState('No Filter');
  const [selected, setSelected] = useState<ProjectSummaryItem[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<string>(
    'Warning, all project data will be deleted and cannot be recovered. Are you sure you want to delete?'
  );

  useEffect(() => {
    if (!pageLoading) {
      setProjects(allProjectSummary);
    }
  }, [allProjectSummary]);

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
                  buttonPath: `/${
                    (user as User).user_metadata.companyId
                  }/projects/add-project`,
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
                    filterKey="projectSuper"
                    baseUrl={`/${
                      (user as User).user_metadata.companyId
                    }/projects`}
                    onButtonClick={buttonClickHandler}
                    checkboxButtons={checkboxButtons}
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
