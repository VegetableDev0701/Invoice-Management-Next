import { useEffect } from 'react';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';

import { AddProcessInvoiceActions } from '@/lib/models/types';
import { ChangeOrderSummary } from '@/lib/models/summaryDataModel';
import {
  InvoiceTableRow,
  InvoiceLineItemItem,
} from '@/lib/models/invoiceDataModels';

import Button from '@/components/UI/Buttons/Button';
import { Input } from '@/components/Inputs/Input';
import DollarSign from '@/public/icons/DollarSign';
import classes from '../InputFormLayout/FormLayout.module.css';

export interface Props {
  form: string;
  actions: AddProcessInvoiceActions;
  showError?: boolean;
  currentData: InvoiceTableRow | null;
  changeOrdersSummary?: ChangeOrderSummary | undefined;
  projectId?: string;
  onMouseEnterHandler: (
    currentData: InvoiceTableRow | null,
    id: string
  ) => void;
  onMouseLeaveHandler: () => void;
}

function LineItems(props: Props) {
  const {
    actions,
    form,
    currentData,
    projectId,
    changeOrdersSummary,
    onMouseEnterHandler,
    onMouseLeaveHandler,
  } = props;
  const dispatch = useDispatch();

  const formState = useSelector((state) => state.addProcessInvoiceForm);

  useEffect(() => {
    currentData?.line_items_gpt
      ? dispatch(
          actions.setLineItem(Object.keys(currentData.line_items_gpt).length)
        )
      : dispatch(actions.setLineItem(1));
  }, []);
  const numLineItems = useSelector(
    (state) => state.addProcessInvoiceForm.numLineItems.value
  );

  const incrementLineItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch(actions.incrementLineItem());
  };
  const decrementLineItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    dispatch(actions.decrementLineItem());
  };

  // currentData.line_items_gpt can be null, and if so we want the null to persist
  // but also still rename to make the code easier to read further down
  const lineItemsGPT: InvoiceLineItemItem[] | null = currentData?.line_items_gpt
    ? Object.values(currentData.line_items_gpt)
    : null;

  const lineItemsJSX = [];
  for (let i = 0; i < (numLineItems as number); i++) {
    lineItemsJSX.push(
      <div key={i}>
        <div className="flex items-center font-sans px-5 py-2 text-stak-dark-gray font-semibold gap-2">
          <div>{`Line Item ${i + 1}`}</div>
          <span className="border-t-2 w-[15%] border-stak-light-gray" />
        </div>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Line Item Description',
              id: `${i + 1}-description`,
              type: 'text',
              required: false,
              errormessage: 'Line item description is required.',
              value:
                lineItemsGPT && lineItemsGPT[i]?.['description']
                  ? (lineItemsGPT[i]?.['description'] as string)
                  : '',
              isCurrency: false,
              isOnOverlay: true,
            }}
            projectId={projectId}
            actions={actions}
            onMouseEnter={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onMouseLeave={onMouseLeaveHandler}
            onFocus={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onBlur={onMouseLeaveHandler}
          />
        </div>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Line Item Amount',
              id: `${i + 1}-amount`,
              type: 'text',
              inputmode: 'numeric',
              required: false,
              errormessage: 'Number of hours worked is required.',
              value:
                lineItemsGPT && lineItemsGPT[i]?.['amount']
                  ? lineItemsGPT[i]['amount']
                  : '',
              isCurrency: true,
              isOnOverlay: true,
            }}
            icon={<DollarSign width={null} height={null} />}
            projectId={projectId}
            actions={actions}
            onMouseEnter={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onMouseLeave={onMouseLeaveHandler}
            onFocus={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onBlur={onMouseLeaveHandler}
          />
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Billable',
              id: `${i + 1}-billable`,
              inputType: 'slideToggle',
              required: false,
              value:
                lineItemsGPT && lineItemsGPT[i]?.['billable']
                  ? lineItemsGPT[i]['billable']
                  : true,
              isOnOverlay: true,
            }}
            projectId={projectId}
            actions={actions}
          />
        </div>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Cost Code',
              id: `${i + 1}-cost-code`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              value:
                lineItemsGPT && lineItemsGPT[i]?.['cost_code']
                  ? lineItemsGPT[i]['cost_code']
                  : 'None',
              required: false,
              isOnOverlay: true,
            }}
            projectId={projectId}
            actions={actions}
            onMouseEnter={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onMouseLeave={onMouseLeaveHandler}
            onFocus={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onBlur={onMouseLeaveHandler}
          />
        </div>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Work Description',
              id: `${i + 1}-work-description`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: false,
              errormessage: 'Work description is required.',
              value:
                lineItemsGPT && lineItemsGPT[i]?.['work_description']
                  ? lineItemsGPT[i]['work_description']
                  : 'None',
              isCurrency: false,
              isOnOverlay: true,
            }}
            projectId={projectId}
            actions={actions}
            onMouseEnter={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onMouseLeave={onMouseLeaveHandler}
            onFocus={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onBlur={onMouseLeaveHandler}
          />
        </div>
        <div className="flex py-2 px-5 self-stretch gap-4">
          <Input
            form={form}
            classes="flex-1"
            input={{
              label: 'Change Order',
              id: `${i + 1}-change-order`,
              type: 'text',
              inputType: 'dropdownWithSearch',
              required: false,
              errormessage: 'Change order is required.',
              value:
                lineItemsGPT && lineItemsGPT[i]?.['change_order']
                  ? ((
                      lineItemsGPT[i]['change_order'] as {
                        name: string;
                        uuid: string;
                      }
                    ).name as string)
                  : formState[`${i + 1}-change-order`]?.value
                  ? formState[`${i + 1}-change-order`]?.value
                  : 'None',
              isCurrency: false,
              isOnOverlay: true,
            }}
            projectId={projectId}
            actions={actions}
            changeOrdersSummary={changeOrdersSummary}
            onMouseEnter={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onMouseLeave={onMouseLeaveHandler}
            onFocus={() =>
              onMouseEnterHandler(currentData, `${i + 1}-description`)
            }
            onBlur={onMouseLeaveHandler}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col px-1 self-stretch" id="line-items">
      <span className={classes['separator']}></span>
      {lineItemsJSX}
      <div id="add-button" className="flex my-0 px-5 self-stretch gap-4">
        <Button
          className="px-4 my-4 text-lg"
          onClick={incrementLineItem}
          buttonText="Add Line Item"
        />
        {(numLineItems as number) > 0 && (
          <Button
            className="px-4 my-4 text-lg"
            onClick={decrementLineItem}
            buttonText="Remove Line Item"
          />
        )}
      </div>
      <span className={classes['separator']} />
    </div>
  );
}

export default LineItems;
