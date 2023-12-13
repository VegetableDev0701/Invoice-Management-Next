import { useEffect, useRef, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

import { invoiceActions } from '@/store/invoice-slice';
import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';
import { addProcessInvoiceFormActions } from '@/store/add-process-invoice';
import { addProcessedInvoiceData } from '@/store/company-data-slice';
import { contractActions } from '@/store/contract-slice';

import { useKeyPressActionOverlay } from '@/hooks/use-save-on-key-press';

import { FormStateV2, User } from '@/lib/models/formStateModels';
import { InvoiceTableRow, Invoices } from '@/lib/models/invoiceDataModels';
import { snapshotCopy } from '@/lib/utility/utils';

import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/20/solid';

interface Props {
  pageArray: string[];
  open: boolean;
  currentRowIdx?: number;
  rows: InvoiceTableRow[] | null;
  snapShotFormState?: FormStateV2;
  updateData?: boolean;
  onChangePage: (activePage: number) => void;
}

const notActiveClasses =
  'inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:cursor-pointer';
const activeClasses =
  'inline-flex items-center border-t-2 border-stak-dark-green px-4 pt-4 text-sm font-medium text-gray-800';

export default function CenteredPagination(props: Props) {
  const {
    pageArray,
    rows,
    currentRowIdx,
    open,
    snapShotFormState,
    updateData = true,
    onChangePage,
  } = props;
  const [activePageIdx, setActivePageIdx] = useState(0);

  const forwardButtonRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLDivElement>(null);

  const { user } = useUser();

  const dispatch = useDispatch();
  const allInvoices: Invoices = useSelector(
    (state) => state.data.invoices.allInvoices
  );

  const processInvoiceFormState: FormStateV2 = useSelector(
    (state) => state.addProcessInvoiceForm
  );

  const overlayContent = useSelector((state) => state.overlay);

  useKeyPressActionOverlay({
    isActive:
      overlayContent['process-invoices'].open && !overlayContent.vendors.open,
    formOverlayOpen: open,
    ref: forwardButtonRef,
    isMoveForward: true,
    keyName: 'Enter',
  });
  useKeyPressActionOverlay({
    isActive:
      overlayContent['process-invoices'].open && !overlayContent.vendors.open,
    formOverlayOpen: open,
    ref: backButtonRef,
    isMoveBackward: true,
    keyName: 'Enter',
  });

  useEffect(() => {
    onChangePage(activePageIdx);
  }, [activePageIdx]);

  const decrementRow = () => {
    if (currentRowIdx !== undefined && rows) {
      dispatch(
        invoiceActions.setClickedInvoice({
          invoice: rows[currentRowIdx - 1],
          isRowClicked: true,
          invoiceRowNumber: currentRowIdx - 1,
        })
      );
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            currentId: rows[currentRowIdx - 1].doc_id,
            currentData: allInvoices[rows[currentRowIdx - 1].doc_id],
          },
          stateKey: 'process-invoices',
        })
      );
      dispatch(
        contractActions.setClickedContract({
          contract: null,
          isRowClicked: false,
        })
      );

      if (
        processInvoiceFormState?.isUpdated.value &&
        snapShotFormState &&
        updateData
      ) {
        dispatch(
          addProcessedInvoiceData({
            companyId: (user as User).user_metadata.companyId,
            invoiceId: rows[currentRowIdx].doc_id,
            projectName: rows[currentRowIdx].project,
            snapShotFormState,
          })
        );
      }
      dispatch(
        invoiceActions.getInvoiceSnapshot({
          formState: snapshotCopy(processInvoiceFormState) as FormStateV2,
          doc_id: rows[currentRowIdx].doc_id,
        })
      );
      dispatch(addProcessInvoiceFormActions.clearFormState());
    }
  };

  const incrementRow = () => {
    if (currentRowIdx !== undefined && rows) {
      dispatch(
        invoiceActions.setClickedInvoice({
          invoice: rows[currentRowIdx + 1],
          isRowClicked: true,
          invoiceRowNumber: currentRowIdx + 1,
        })
      );
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            currentId: rows[currentRowIdx + 1].doc_id,
            currentData: allInvoices[rows[currentRowIdx + 1].doc_id],
          },
          stateKey: 'process-invoices',
        })
      );
      dispatch(
        contractActions.setClickedContract({
          contract: null,
          isRowClicked: false,
        })
      );

      if (
        processInvoiceFormState?.isUpdated.value &&
        snapShotFormState &&
        updateData
      ) {
        dispatch(
          addProcessedInvoiceData({
            companyId: (user as User).user_metadata.companyId,
            invoiceId: rows[currentRowIdx].doc_id,
            projectName: rows[currentRowIdx].project,
            snapShotFormState,
          })
        );
      }
      dispatch(
        invoiceActions.getInvoiceSnapshot({
          formState: snapshotCopy(processInvoiceFormState) as FormStateV2,
          doc_id: rows[currentRowIdx].doc_id,
        })
      );
      dispatch(addProcessInvoiceFormActions.clearFormState());
    }
  };

  return (
    <nav className="flex items-center font-sans justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px pl-4 flex w-0 flex-1">
        {currentRowIdx !== undefined && currentRowIdx > 0 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              decrementRow();
              dispatch(overlayActions.removeCurrentInvoiceEntityBox());
            }}
            ref={backButtonRef}
            className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:cursor-pointer"
          >
            <ArrowLongLeftIcon
              className="mr-3 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            Previous
          </div>
        )}
      </div>
      <div className="hidden md:-mt-px md:flex">
        {pageArray.map((_page, i) => {
          return (
            <div
              key={i}
              onClick={() => setActivePageIdx(i)}
              className={`${
                i === activePageIdx ? activeClasses : notActiveClasses
              }`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <div className="-mt-px pr-4 flex w-0 flex-1 justify-end">
        {currentRowIdx !== undefined &&
          rows &&
          currentRowIdx < rows.length - 1 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                incrementRow();
                dispatch(overlayActions.removeCurrentInvoiceEntityBox());
              }}
              ref={forwardButtonRef}
              className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:cursor-pointer"
            >
              Next
              <ArrowLongRightIcon
                className="ml-3 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          )}
      </div>
    </nav>
  );
}
