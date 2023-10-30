import React from 'react';
import { shallowEqual } from 'react-redux';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { invoiceActions } from '@/store/invoice-slice';
import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { sortArrayById, sortArrayByObjKey } from '@/lib/utility/tableHelpers';
import { ProjectSummary, Rows } from '@/lib/models/summaryDataModel';
import { InvoiceProject } from '@/lib/models/invoiceDataModels';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface ExtendedItems extends Partial<Items> {
  sortBy: 'label' | 'id';
  forceToTopKey?: string;
}

interface Props {
  input: ExtendedItems;
  sortBy: 'label' | 'id';
  invoiceId: string;
}

interface Selected {
  id?: number;
  label: string;
  project_uuid: string | null;
}

// TODO Each time the user picks a new project for that invoice everything gets rendered again
// this is not optimal and I can avoid this by only pushing the invoice project updates
// to an independent state, but then the filters don't work and since they are on the parent
// componenet to bring that updated state there, I would have the same problem. Going to push
// this for now and hopefully it is not a problem in the future.
const TableDropdown = (props: Props) => {
  const { input, sortBy, invoiceId } = props;

  const projects: ProjectSummary = useSelector(
    (state) => state.data.projectsSummary.allProjects,
    shallowEqual
  );
  const invoiceProject: InvoiceProject = useSelector(
    (state) => state.data.invoices.allInvoices[invoiceId]?.project,
    shallowEqual
  );
  const updatedProject: InvoiceProject = useSelector(
    (state) => state.invoice.invoiceProjects[invoiceId]
  );

  const [selected, setSelected] = useState<Selected>({
    label: updatedProject?.name ? updatedProject.name : invoiceProject?.name,
    project_uuid: updatedProject?.name
      ? updatedProject.uuid
      : invoiceProject?.uuid
      ? invoiceProject.uuid
      : null,
  });
  const dispatch = useDispatch();

  useEffect(() => {
    setSelected({
      label: updatedProject?.name ? updatedProject.name : invoiceProject?.name,
      project_uuid: updatedProject?.uuid
        ? updatedProject.uuid
        : invoiceProject?.uuid
        ? invoiceProject.uuid
        : null,
    });
  }, [updatedProject?.name]);

  useEffect(() => {
    const project = Object.values(projects).find((project) => {
      return project.uuid === selected.project_uuid;
    });
    if (project) {
      dispatch(
        invoiceActions.updateInvoiceProject({
          [invoiceId]: {
            name: project.projectName as string,
            address: project.address as string,
            // project_key: project.projectId as string,
            uuid: project.uuid as string,
          },
        })
      );
    }
  }, [selected]);

  const sortedMenuOptions = useMemo(() => {
    if (sortBy === 'label') {
      return sortArrayByObjKey(
        input.selectMenuOptions as SelectMenuOptions[],
        'label',
        input?.forceToTopKey || 'No Filter'
      );
    } else if (sortBy === 'id') {
      return sortArrayById(input.selectMenuOptions as SelectMenuOptions[]);
    }
  }, [input.selectMenuOptions]);

  return (
    <div className="flex flex-col justify-center p-0 gap-0 max-w-full z-50">
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            <div className="flex flex-row">
              <div className="grow relative">
                <Listbox.Button
                  id={input.id}
                  className={`font-sans w-full border h-6 border-gray-400 rounded-md cursor-default py-0 pl-2 pr-10 text-left focus:border-stak-dark-green focus:shadow-md focus-visible:border-stak-dark-green focus-visible:outline-stak-dark-green focus-visible:outline-0 sm:text-sm`}
                >
                  <span className="flex truncate text-sm">
                    {selected.label}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </Listbox.Button>

                <Transition
                  show={open}
                  as={Fragment}
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto drop-shadow-xl border-stak-light-gray rounded-md bg-white py-1 text-sm text-left shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {sortedMenuOptions &&
                      sortedMenuOptions.map((option) => (
                        <Listbox.Option
                          key={option.id}
                          className={({ active }) =>
                            classNames(
                              'font-sans text-sm relative cursor-default select-none py-1 pl-3 pr-9',
                              active
                                ? 'bg-stak-dark-green text-white'
                                : 'text-stak-dark-gray'
                            )
                          }
                          value={option}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={classNames('block truncate')}>
                                {option.label}
                              </span>

                              {selected ? (
                                <span
                                  className={classNames(
                                    active
                                      ? 'text-white'
                                      : 'text-stak-dark-green',
                                    'absolute inset-y-0 right-0 flex items-center pr-4'
                                  )}
                                >
                                  <CheckIcon
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
};

export default React.memo(TableDropdown);
