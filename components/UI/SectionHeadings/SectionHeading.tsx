import { useEffect, useState } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { Items } from '@/lib/models/formDataModel';
import { InvoiceProject } from '@/lib/models/invoiceDataModels';
import { classNames, isObjectEmpty } from '@/lib/utility/utils';
import { Buttons } from '@/lib/models/uiModels';

import FilterDropdown from '@/components/Inputs/InputFilterDropdown';
import SimpleUploadForm from '@/components/Forms/FileForm/SimpleUploadForm';
import ButtonWithLoader from '../Buttons/ButtonWithLoader';
import { hasAnyExpiredDates } from '@/lib/utility/tableHelpers';
import { VendorSummary } from '@/lib/models/summaryDataModel';

interface SectionTabs {
  name: string;
  keyName: string;
  current: boolean;
}

interface ExtendedItems extends Items {
  sortBy: 'label' | 'id';
}

interface Props {
  tabs: SectionTabs[];
  dropdownFilter?: ExtendedItems;
  title?: string;
  buttons?: Buttons[];
  totalNum?: number;
  onActiveTab: (activeTabKeyName: string) => void;
  onFilter?: (activeFilter: string) => void;
}

export default function SectionHeading(props: Props) {
  const { title, buttons, dropdownFilter, totalNum, onActiveTab, onFilter } =
    props;
  const [tabs, setTabs] = useState(props.tabs);

  const uploadFilesTask = 'upload_files';

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
  const vendorSummary = useSelector(
    (state) => state.data.vendorsSummary.allVendors
  );

  const getNumBySection = (
    keyName: string,
    updatedInvoices?: { [invoiceId: string]: InvoiceProject }
  ) => {
    if (keyName === 'expiredLicense' && !isObjectEmpty(vendorSummary)) {
      return `(${
        Object.values(hasAnyExpiredDates(vendorSummary as VendorSummary)).length
      })`;
    }
    if (keyName === 'isSync' && !isObjectEmpty(vendorSummary)) {
      return `(${
        Object.values(vendorSummary).filter((vendor) => !vendor.agave_uuid)
          .length
      })`;
    }
    if (totalNum) {
      if (keyName === 'all') {
        return `(${totalNum})`;
      }
      if (keyName === 'unassigned' && updatedInvoices) {
        return `(${totalNum - Object.values(updatedInvoices).length})`;
      }
      if (keyName === 'assigned' && updatedInvoices) {
        return `(${Object.values(updatedInvoices).length})`;
      }
    }
    return '';
  };

  return (
    <div className="relative border-b border-gray-300 pb-5 mx-4 my-2 sm:pb-0">
      <div className="md:flex md:items-center md:justify-between">
        {title && (
          <h3 className="text-base font-semibold leading-6 text-stak-black">
            {title}
          </h3>
        )}
        <div className="flex w-full justify-end gap-4 md:absolute md:right-0 md:top-3 md:mt-0">
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
            <>
              {buttons.map((button, i) => {
                if (button.label.includes('Add Invoices')) {
                  return (
                    <SimpleUploadForm
                      key={i}
                      uploadFileType="invoice"
                      buttonLabel="Add Invoices"
                      taskId={uploadFilesTask}
                    />
                  );
                } else {
                  return (
                    <ButtonWithLoader
                      key={i}
                      button={button}
                      taskId={button.taskId}
                    />
                  );
                }
              })}
            </>
          )}
        </div>
      </div>
      <div className="mt-4">
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
                      ? 'border-stak-dark-green text-black'
                      : 'border-transparent  text-gray-600 hover:border-gray-400 hover:text-black hover:cursor-pointer',
                    'font-sans font-medium whitespace-nowrap border-b-2 px-1 pb-2 text-lg z-10'
                  )}
                  aria-current={tab.current ? 'page' : undefined}
                >
                  {`${tab.name} ${getNumBySection(
                    tab.keyName,
                    updatedInvoiceProjects
                  )}`}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
