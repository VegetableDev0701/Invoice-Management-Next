import { useEffect, useRef, useState } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { useKeyPressAction } from '@/hooks/use-save-on-key-press';

import { Items } from '@/lib/models/formDataModel';

import Button from '../Buttons/Button';
import FilterDropdown from '@/components/Inputs/InputFilterDropdown';
import SimpleUploadForm from '@/components/Forms/FileForm/SimpleUploadForm';
import ProjectButtons from '@/components/Projects/ProjectButtons';
import ButtonWithLoader from '../Buttons/ButtonWithLoader';
import { Buttons } from '@/lib/models/uiModels';
import { InvoiceProject } from '@/lib/models/invoiceDataModels';
import { classNames } from '@/lib/utility/utils';

interface SectionTabs {
  name: string;
  keyName: string;
  current: boolean;
}

interface ExtendedItems extends Items {
  sortBy: 'label' | 'id';
}

interface Props {
  pageTitle: string | null;
  tabs: SectionTabs[];
  projectId: string;
  dropdownFilter?: ExtendedItems;
  title?: string;
  buttons?: Buttons[];
  totalInvoices?: number;
  clientBillId?: string;
  isClientBillPage?: boolean;
  onActiveTab: (activeTabKeyName: string) => void;
  onFilter?: (activeFilter: string) => void;
}

export default function ProjectsSectionHeading(props: Props) {
  const {
    pageTitle,
    projectId,
    title,
    buttons,
    dropdownFilter,
    totalInvoices,
    clientBillId,
    isClientBillPage,
    onActiveTab,
    onFilter,
  } = props;

  const [tabs, setTabs] = useState(props.tabs);

  const updateBudgetRef = useRef<HTMLButtonElement>(null);
  const updateProjectDetailsRef = useRef<HTMLButtonElement>(null);

  useKeyPressAction({ ref: updateBudgetRef, keyName: 'Enter' });
  useKeyPressAction({ ref: updateProjectDetailsRef, keyName: 'Enter' });

  useEffect(() => {
    const currentTab = tabs.find((tab) => tab.current) as SectionTabs;
    onActiveTab(currentTab.keyName);
  }, [tabs, onActiveTab]);

  const clickHandler = (name: string) => {
    setTabs(
      tabs.map((tab) => {
        return { ...tab, current: tab.name === name };
      })
    );
  };

  const updatedInvoiceProjects = useSelector(
    (state) => state.invoice.invoiceProjects
  );

  // Used to have multiple sections, now only have "Unassigned", keep for now????
  const getNumInvoicesBySection = (
    keyName: string,
    updatedInvoices: { [invoiceId: string]: InvoiceProject }
  ) => {
    if (totalInvoices) {
      if (keyName === 'all') {
        return `(${totalInvoices})`;
      }
      if (keyName === 'unassigned') {
        return `(${totalInvoices - Object.values(updatedInvoices).length})`;
      }
      if (keyName === 'assigned') {
        return `(${Object.values(updatedInvoices).length})`;
      }
    }
    return '';
  };

  return (
    <>
      <div className="flex mx-4 justify-between sm:pb-0">
        <h1 className="font-sans text-4xl text-gray-700">{pageTitle}</h1>
        <ProjectButtons
          projectId={projectId}
          clientBillId={clientBillId}
          isClientBillPage={isClientBillPage}
        />
      </div>
      <div className="flex justify-between border-b border-gray-300 pb-5 mx-4 h-20 sm:pb-0">
        <div className="flex items-end mt-4">
          <div className="sm:hidden">
            <label htmlFor="current-tab" className="sr-only">
              Select a tab
            </label>
            <select
              id="current-tab"
              name="current-tab"
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-stak-dark-green"
              defaultValue={(tabs.find((tab) => tab.current) || {}).name}
            >
              {tabs.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                return (
                  <div
                    key={tab.name}
                    onClick={() => clickHandler(tab.name)}
                    className={classNames(
                      tab.current
                        ? 'border-stak-dark-green text-gray-900'
                        : 'border-transparent text-gray-600 hover:border-gray-400 hover:text-gray-800 hover:cursor-pointer',
                      'font-sans font-medium whitespace-nowrap border-b-2 px-1 pb-2 md:text-md min-[1650px]:text-lg z-10 '
                    )}
                    aria-current={tab.current ? 'page' : undefined}
                  >
                    {`${tab.name} ${getNumInvoicesBySection(
                      tab.keyName,
                      updatedInvoiceProjects
                    )}`}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
        {/* heading buttons */}
        <div className="md:flex md:items-center md:justify-between mb-2">
          {title && (
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              {title}
            </h3>
          )}
          <div className="flex w-full justify-end gap-4 md:mt-0">
            {dropdownFilter && onFilter && (
              <div className="text-right min-w-[18rem]">
                <FilterDropdown
                  onFilterSupervisor={(activeFilter) => onFilter(activeFilter)}
                  input={dropdownFilter}
                  sortBy={dropdownFilter.sortBy}
                  className="max-w-full"
                />
              </div>
            )}
            {buttons && (
              <div className="flex md:flex-col min-[1770px]:flex-row gap-1">
                {buttons.map((button, i) => {
                  if (
                    (button.label.includes('Add Invoices') ||
                      button.label.includes('Add Contract')) &&
                    tabs
                      .filter((tab) => tab.current)
                      .map((tab) => tab.keyName)[0] === button.isShowingKeyName
                  ) {
                    return (
                      <SimpleUploadForm
                        key={i}
                        projectId={projectId}
                        uploadFileType={
                          button.label.includes('Add Invoices')
                            ? 'invoice'
                            : 'contract'
                        }
                        buttonLabel={button.label}
                        taskId="upload_files"
                      />
                    );
                  } else if (
                    button.label.toLowerCase().includes('quickbooks')
                  ) {
                    return <ButtonWithLoader key={i} button={button} />;
                  } else if (
                    tabs
                      .filter((tab) => tab.current)
                      .map((tab) => tab.keyName)[0] === button.isShowingKeyName
                  ) {
                    return (
                      <Button
                        key={i}
                        type="button"
                        buttonText={button.label}
                        className="2xl:px-6 md:px-3 py-1 md:text-md 2xl:text-xl font-normal bg-stak-dark-green"
                        disabled={button.disabled}
                        onClick={button.onClick}
                        ref={
                          button.label === 'Update Budget'
                            ? updateBudgetRef
                            : button.label === 'Update Project Details'
                            ? updateProjectDetailsRef
                            : undefined
                        }
                      />
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
