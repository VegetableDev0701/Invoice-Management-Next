import React, { useEffect } from 'react';

import { addProcessInvoiceFormActions } from '@/store/add-process-invoice';
import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { overlayActions } from '@/store/overlay-control-slice';

import { formatNameForID } from '@/lib/utility/formatter';
import { getFormIcon } from '@/lib/utility/formHelpers';
import { Actions, FormData } from '@/lib/models/types';
import { FormState } from '@/lib/models/formStateModels';
import {
  InputElementWithAddressItems,
  MainCategories,
  isInputElementWithAddressElements,
} from '@/lib/models/formDataModel';
import { getCurrentInvoiceData } from '@/lib/utility/processInvoiceHelpers';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';
import { BoundingBox, InvoiceTableRow } from '@/lib/models/invoiceDataModels';

import classes from '../InputFormLayout/FormLayout.module.css';
import InputAddressAutocomplete from '@/components/Inputs/InputAddressAutocomplete';
import LineItems from './LineItems';
import { Input } from '../../Inputs/Input';
import MultipleCostCodes from './MultipleCostCodes';

interface EmptyAddLaborFormForTesting {
  mainCategories: MainCategories[];
  numRecurringFees: number;
}

export interface Props {
  formData: FormData | EmptyAddLaborFormForTesting;
  formState: FormState;
  showError: boolean;
  currentData: InvoiceTableRow | null;
  actions: Actions;
  form: string;
  projectId: string;
  onRenderComplete: () => void;
}

function ProcessInvoiceForm(props: Props) {
  const {
    formData,
    formState,
    showError,
    actions,
    form,
    projectId,
    currentData,
    onRenderComplete,
  } = props;
  const dispatch = useDispatch();
  const changeOrdersSummary: ChangeOrderSummary = useSelector(
    (state) => state.projects[projectId]?.['change-orders-summary']
  ) as ChangeOrderSummary;

  useEffect(() => {
    onRenderComplete();
  }, []);

  // logic to handle the mouse hover over input field and magnify that
  // corresponding section on image
  const onMouseEnterHandler = (
    currentData: InvoiceTableRow | null,
    id: string
  ) => {
    if (!currentData) return;
    let boundingBox: BoundingBox[] | null = [];
    const lineItemMatch = id.match(/(\d+)-(description|amount)/);
    if (lineItemMatch) {
      const lineNumber = lineItemMatch[1];
      const lineItemKey = `line_item_${lineNumber}`;
      if (currentData?.line_items_gpt?.[lineItemKey]?.bounding_box) {
        boundingBox = [
          currentData.line_items_gpt[lineItemKey].bounding_box as BoundingBox,
        ];
      }
    } else if (id === 'vendor-name') {
      boundingBox = currentData?.vendor_name_bb;
    } else if (id === 'invoice-number') {
      boundingBox = currentData?.invoice_id_bb;
    } else if (id === 'invoice-total') {
      boundingBox = currentData?.total_amount_bb;
    } else if (id === 'total-tax') {
      boundingBox = currentData?.total_tax_amount_bb;
    } else {
      return;
    }
    if (boundingBox) {
      dispatch(overlayActions.setCurrentInvoiceEntityBox({ boundingBox }));
    }
  };

  const onMouseLeaveHandler = () => {
    dispatch(overlayActions.removeCurrentInvoiceEntityBox());
  };

  return (
    <>
      <div className={classes['scroll-frame']} id="scroll-frame">
        <form id="form-id" className="flex flex-col flex-grow">
          {formData.mainCategories.map((category, i) => {
            if (category.name === 'Line Items') {
              if (formState['line-item-toggle']?.value) {
                return (
                  <LineItems
                    projectId={projectId}
                    key={`${category.name}_${i}`}
                    form="addProcessInvoice"
                    actions={addProcessInvoiceFormActions}
                    currentData={currentData}
                    changeOrdersSummary={changeOrdersSummary}
                    onMouseEnterHandler={onMouseEnterHandler}
                    onMouseLeaveHandler={onMouseLeaveHandler}
                  />
                );
              }
            }
            return (
              <div
                key={formatNameForID(category.name)}
                className="flex flex-col px-1 self-stretch"
                id={formatNameForID(category.name)}
              >
                {category.inputElements.map((el, j) => {
                  if (isInputElementWithAddressElements(el)) {
                    return (
                      <InputAddressAutocomplete
                        key={j}
                        classes="flex-1 px-5 py-2"
                        actions={actions}
                        input={
                          (el as InputElementWithAddressItems).addressElements
                        }
                        formState={formState}
                        showError={showError}
                      />
                    );
                  } else {
                    return (
                      <>
                        {el.items.map((item, p) => {
                          const currentItem = currentData
                            ? getCurrentInvoiceData(item, currentData)
                            : item;

                          if (
                            item.id === 'work-description' &&
                            formState['line-item-toggle']?.value
                          ) {
                            return (
                              <div
                                key={`${i}_${j}`}
                                className="flex py-2 px-5 self-stretch gap-4"
                              >
                                <MultipleCostCodes
                                  key={`${formatNameForID(item.label)}_${p}`}
                                  currentData={currentData}
                                />
                              </div>
                            );
                          } else if (
                            (item.id === 'cost-code' ||
                              item.id === 'change-order') &&
                            formState['line-item-toggle']?.value
                          ) {
                            return (
                              <div
                                key={`${i}_${j}`}
                                className="flex p-0 self-stretch gap-4"
                              />
                            );
                          } else {
                            return (
                              <div
                                key={`${i}_${j}`}
                                className="flex py-2 px-5 self-stretch gap-4"
                              >
                                <Input
                                  classes="flex-1"
                                  key={`${formatNameForID(item.label)}_${p}`}
                                  input={{
                                    ...currentItem,
                                  }}
                                  icon={getFormIcon(item)}
                                  showError={showError}
                                  actions={actions}
                                  form={form}
                                  projectId={projectId}
                                  changeOrdersSummary={changeOrdersSummary}
                                  onMouseEnter={() =>
                                    onMouseEnterHandler(currentData, item.id)
                                  }
                                  onMouseLeave={onMouseLeaveHandler}
                                  onFocus={() =>
                                    onMouseEnterHandler(currentData, item.id)
                                  }
                                  onBlur={onMouseLeaveHandler}
                                  autofocus={
                                    i === 0 && j === 0 && p === 0 ? true : false
                                  }
                                />
                              </div>
                            );
                          }
                        })}
                      </>
                    );
                  }
                })}
              </div>
            );
          })}
        </form>
      </div>
    </>
  );
}

export default ProcessInvoiceForm;
