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

import { FormState, User } from '@/lib/models/formStateModels';
import { InvoiceTableRow, Invoices } from '@/lib/models/invoiceDataModels';

import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/20/solid';

interface Props {
  pageArray: string[];
  open: boolean;
  currentRow?: number;
  rows: InvoiceTableRow[] | null;
  snapShotFormState?: FormState;
  onChangePage: (activePage: number) => void;
}

const notActiveClasses =
  'inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:cursor-pointer';
const activeClasses =
  'inline-flex items-center border-t-2 border-stak-dark-green px-4 pt-4 text-sm font-medium text-gray-800';

export default function CenteredPagination(props: Props) {
  const { pageArray, rows, currentRow, open, snapShotFormState, onChangePage } =
    props;
  const [activePageIdx, setActivePageIdx] = useState(0);

  const forwardButtonRef = useRef<HTMLDivElement>(null);
  const backButtonRef = useRef<HTMLDivElement>(null);
  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: forwardButtonRef,
    keyName: 'ArrowRight',
  });
  useKeyPressActionOverlay({
    formOverlayOpen: open,
    ref: backButtonRef,
    keyName: 'ArrowLeft',
  });

  const { user } = useUser();

  const dispatch = useDispatch();
  const allInvoices: Invoices = useSelector(
    (state) => state.data.invoices.allInvoices
  );
  const isInvoiceUpdated: boolean = useSelector(
    (state) => state.addProcessInvoiceForm?.isUpdated.value
  ) as boolean;

  useEffect(() => {
    onChangePage(activePageIdx);
  }, [activePageIdx]);

  const decrementRow = () => {
    if (currentRow !== undefined && rows) {
      dispatch(
        invoiceActions.setClickedInvoice({
          invoice: rows[currentRow - 1],
          isRowClicked: true,
          invoiceRowNumber: currentRow - 1,
        })
      );
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            currentId: rows[currentRow - 1].doc_id,
            currentData: allInvoices[rows[currentRow - 1].doc_id],
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
      if (isInvoiceUpdated && snapShotFormState) {
        dispatch(
          addProcessedInvoiceData({
            companyId: (user as User).user_metadata.companyId,
            invoiceId: rows[currentRow].doc_id,
            projectName: rows[currentRow].project,
            snapShotFormState,
          })
        );
      }
      dispatch(addProcessInvoiceFormActions.clearFormState());
    }
  };

  const incrementRow = () => {
    if (currentRow !== undefined && rows) {
      dispatch(
        invoiceActions.setClickedInvoice({
          invoice: rows[currentRow + 1],
          isRowClicked: true,
          invoiceRowNumber: currentRow + 1,
        })
      );
      dispatch(
        overlayActions.setOverlayContent({
          data: {
            currentId: rows[currentRow + 1].doc_id,
            currentData: allInvoices[rows[currentRow + 1].doc_id],
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
      if (isInvoiceUpdated && snapShotFormState) {
        dispatch(
          addProcessedInvoiceData({
            companyId: (user as User).user_metadata.companyId,
            invoiceId: rows[currentRow].doc_id,
            projectName: rows[currentRow].project,
            snapShotFormState,
          })
        );
      }
      dispatch(addProcessInvoiceFormActions.clearFormState());
    }
  };

  return (
    <nav className="flex items-center font-sans justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px pl-4 flex w-0 flex-1">
        {currentRow !== undefined && currentRow > 0 && (
          <div
            onClick={() => {
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
        {pageArray.map((page, i) => {
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
        {currentRow !== undefined && rows && currentRow < rows.length - 1 && (
          <div
            onClick={() => {
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
