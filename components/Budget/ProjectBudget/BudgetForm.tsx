import React, { useState, useEffect } from 'react';
import {
  ControlledTreeEnvironment,
  Tree,
  TreeItem,
  TreeItemIndex,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

import {
  useAppDispatch as useDispatch,
  useAppSelector as useSelector,
} from '@/store/hooks';
import { addBudgetFormActions } from '@/store/add-budget-slice';
import { projectDataActions } from '@/store/projects-data-slice';

import scrollToElement from '@/lib/utility/scrollToElement';
import { formatNameForID } from '@/lib/utility/formatter';
import { Actions } from '@/lib/models/types';
import { formatNumber } from '@/lib/utility/formatter';

import Card from '@/components/UI/Card';

import { classNames } from '@/lib/utility/utils';

import classes from '../../Forms/InputFormLayout/FormLayout.module.css';
import ToggleOffInputIcon from '@/public/icons/ToggleOffInput';
import ToggleOnInputIcon from '@/public/icons/ToggleOnInput';

import TreeComponentClasses from './BudgetForm.module.css';
import { ConvertTreeData } from '@/lib/utility/treeDataHelpers';
import {
  CostCodeItem,
  CostCodesData,
  TreeData,
} from '@/lib/models/budgetCostCodeModel';

interface Props {
  formData: CostCodesData;
  clickedLink: string;
  dummyForceRender: boolean;
  anchorScrollElement: string;
  projectId: string;
}

const initTreeData = {
  root: {
    index: 'root',
    data: {
      name: '',
      number: 0,
    },
  },
};

export default function BudgetForm(props: Props) {
  const {
    formData,
    clickedLink,
    anchorScrollElement,
    dummyForceRender,
    projectId,
  } = props;

  const formState = useSelector((state) => state.addBudgetForm);
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const [valueAddedItems, setValueAddedItems] = useState<
    Array<{
      index: TreeItemIndex;
      value: string;
    }>
  >([]);
  const [costCodeTreeDataList, setCostCodeTreeDataList] =
    useState<TreeData>(initTreeData);
  const dispatch = useDispatch();
  // Since the app is listening for the `Enter` keypress event attached to the
  // `Update Budget` button in the heading, i.e. submitting the form, we want to
  // override the default behavior of forms to "click" the first button it finds
  // inside a <form></form> block to avoid strange behavior.
  useEffect(() => {
    const convertTreeData = new ConvertTreeData();
    const treeData: TreeData =
      convertTreeData.convertCostCode2TreeData(formData);
    convertTreeData.calculateCostCode(treeData);
    setCostCodeTreeDataList({
      ...treeData,
    });

    const total = convertTreeData.getTotalBudget(treeData);
    const divisionTotals = convertTreeData.getTotalDivision(treeData);
    const subDivisionTotals = convertTreeData.getTotalSubDivision(treeData);
    dispatch(
      addBudgetFormActions.setFormElement({
        total: total.toFixed(2),
        divisionTotals,
        subDivisionTotals,
      })
    );
  }, [formData]);

  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLElement).nodeName === 'INPUT') {
        e.preventDefault();
      }
    };

    // Add event listener to the form element instead of window
    const formElement = document.getElementById('form-id');
    formElement?.addEventListener('keydown', keyDownHandler);

    return () => {
      formElement?.removeEventListener('keydown', keyDownHandler);
    };
  }, []);

  useEffect(() => {
    scrollToElement(clickedLink, anchorScrollElement, 'scroll-frame');
  }, [clickedLink, dummyForceRender]);

  useEffect(() => {
    const openedItems = Object.keys(costCodeTreeDataList).filter(
      (treeItemIndex) =>
        treeItemIndex !== 'root' &&
        (
          costCodeTreeDataList[treeItemIndex].data as Omit<
            CostCodeItem,
            'subItems'
          >
        )?.isOpened
    );
    setExpandedItems(openedItems);
  }, [costCodeTreeDataList]);

  const getItemTitle = (item: TreeItem) => {
    const isDivision = costCodeTreeDataList?.root?.children?.includes(
      item.index
    );
    let isSubDivision = false;
    costCodeTreeDataList?.root?.children?.forEach((subDivision) => {
      if (costCodeTreeDataList[subDivision].children?.includes(item.index)) {
        isSubDivision = true;
      }
    });

    const itemData = item;
    if (isDivision) {
      if (itemData.data.value !== '0.00') {
        return itemData.data.number.toString().padStart(2, '0') != '00'
          ? itemData.data.number.toString().padStart(2, '0') +
              ' - ' +
              itemData.data.name +
              ' $' +
              formatNumber(itemData.data.value)
          : itemData.data.name + ' $' + formatNumber(itemData.data.value);
      } else {
        return itemData.data.number.toString().padStart(2, '0') != '00'
          ? itemData.data.number.toString().padStart(2, '0') +
              ' - ' +
              itemData.data.name
          : itemData.data.name;
      }
    } else if (isSubDivision) {
      if (itemData.data.name) {
        if (itemData.data.value !== '0.00') {
          return (
            itemData.data.number.toString() +
            ' - ' +
            itemData.data.name +
            ' $' +
            formatNumber(itemData.data.value)
          );
        } else {
          return itemData.data.number.toString() + ' - ' + itemData.data.name;
        }
      }
    }
    if (itemData.data.value !== '0.00') {
      return (
        itemData.data.number.toFixed(4) +
        ' - ' +
        itemData.data.name +
        ' $' +
        formatNumber(itemData.data.value)
      );
    } else {
      return itemData.data.number.toFixed(4) + ' - ' + itemData.data.name;
    }
  };

  const handleAddValue = (treeItemIndex: TreeItemIndex, value: string) => {
    if (valueAddedItems.map((item) => item.index).includes(treeItemIndex)) {
      setValueAddedItems((prev) =>
        prev.filter((item) => item.index !== treeItemIndex)
      );
    } else {
      setValueAddedItems((prev) => [
        ...prev,
        { index: treeItemIndex, value: '' },
      ]);
    }
  };

  const handleChangeValue = (value: string, treeItemIndex: TreeItemIndex) => {
    const updatedValueAddedItems = valueAddedItems.find(
      (v) => v.index === treeItemIndex
    );
    if (updatedValueAddedItems) {
      updatedValueAddedItems.value = value;
      setValueAddedItems([...valueAddedItems]);
    }

    const newTreeData = { ...costCodeTreeDataList };
    (newTreeData[treeItemIndex].data as CostCodeItem).value = value;
    const convertTreeData = new ConvertTreeData();
    convertTreeData.calculateCostCode(newTreeData);
    const total = convertTreeData.getTotalBudget(newTreeData);
    // const divisionTotals = convertTreeData.getTotalDivision(newTreeData);
    // const subDivisionTotals = convertTreeData.getTotalSubDivision(newTreeData);
    dispatch(
      addBudgetFormActions.setFormElement({
        total: total.toFixed(2),
        divisionTotals: {},
        subDivisionTotals: {},
      })
    );
    (newTreeData[treeItemIndex].data as CostCodeItem).value = value;
    const newFormData = convertTreeData.convertTreeData2CostCode(newTreeData);
    dispatch(
      projectDataActions.updateCostCodeData({
        projectId,
        data: newFormData,
      })
    );
    setCostCodeTreeDataList(newTreeData);
  };

  return (
    <Card
      className={`${classes['parent-frame']} ${classes['parent-frame__form']} bg-stak-white`}
    >
      <div
        className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
        id="scroll-frame"
      >
        {/* {formData.divisions.map((division, i) => {
            return (
              <div
                key={`${division.name}_${i}`}
                className="flex flex-col self-stretch"
                id={formatNameForID(division.name)}
              >
                <span className="flex justify-between items-center pr-2 font-sans text-3xl font-semibold">
                  {division.number.toString().padStart(2, '0') != '00'
                    ? `${division.number.toString().padStart(2, '0')} - ${
                        division.name
                      } - $ ${
                        formState.totalDivisions[division.number.toString()]
                          ?.value
                      }`
                    : `${division.name} - $ ${
                        formState.totalDivisions[division.number.toString()]
                          ?.value
                      }`}
                </span>
                {division.subdivisions.map((subdiv, j) => {
                  return (
                    <div
                      key={`${i}_${j}`}
                      className={`flex flex-col self-stretch g-1`}
                    >
                      {subdiv.name !== '_' && (
                        <span
                          className={`flex justify-between items-center text-2xl pt-2 pr-2 pb-2 pl-4 w-full`}
                        >
                          {`${subdiv.number} - ${subdiv.name} - $ ${
                            formState.totalSubDivisions[
                              subdiv.number.toString()
                            ]?.value
                          }`}
                          {!formState.isCollapsed && (
                            <span className="border-t-2 mx-3 border-gray-500 flex-1 h-0 w-2" />
                          )}
                        </span>
                      )}
                      <div
                        className={`flex flex-col self-stretch gap-2 px-10 ${
                          formState.isCollapsed ? '' : 'py-2'
                        }`}
                      >
                        {subdiv.items.map((item, p) => {
                          return (
                            <React.Fragment
                              key={`${formatNameForID(item.label)}_${p}`}
                            >
                              {Object.keys(formState.budget).length > 0 &&
                                formState.budget[item.id]?.isShowing && (
                                  <Input
                                    classes="flex-1"
                                    input={{
                                      ...item,
                                    }}
                                    icon={getFormIcon(item)}
                                    showError={false}
                                    actions={actions}
                                    form="addBudget"
                                  />
                                )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })} */}
        {costCodeTreeDataList && (
          <ControlledTreeEnvironment
            items={costCodeTreeDataList}
            getItemTitle={getItemTitle}
            viewState={{
              ['tree-costcode']: {
                expandedItems,
                selectedItems,
                focusedItem,
              },
            }}
            canSearch={false}
            canDragAndDrop={false}
            canDropOnFolder={false}
            canReorderItems={false}
            onFocusItem={(item) => setFocusedItem(item.index)}
            onSelectItems={(items) => setSelectedItems((prev) => [...items])}
            canRename={false}
            onExpandItem={(item: TreeItem<any>) => {
              const newTreeData = { ...costCodeTreeDataList };
              (
                newTreeData[item.index].data as Omit<CostCodeItem, 'subItems'>
              ).isOpened = true;
              setCostCodeTreeDataList(newTreeData);
            }}
            onCollapseItem={(item) => {
              const newTreeData = { ...costCodeTreeDataList };
              (
                newTreeData[item.index].data as Omit<CostCodeItem, 'subItems'>
              ).isOpened = false;
              setCostCodeTreeDataList(newTreeData);
            }}
            renderItem={({ item, depth, children, title, context, arrow }) => {
              const InteractiveComponent = context.isRenaming
                ? 'div'
                : 'button';
              const type = context.isRenaming ? undefined : 'button';
              // TODO have only root li component create all the classes
              return (
                <li
                  id={formatNameForID(item.data.name)}
                  {...(context.itemContainerWithChildrenProps as any)}
                  className={classNames(
                    'rct-tree-item-li',
                    item.isFolder && 'rct-tree-item-li-isFolder',
                    context.isSelected && 'rct-tree-item-li-selected',
                    context.isExpanded && 'rct-tree-item-li-expanded',
                    context.isFocused && 'rct-tree-item-li-focused',
                    context.isDraggingOver && 'rct-tree-item-li-dragging-over',
                    context.isSearchMatching && 'rct-tree-item-li-search-match',
                    '!py-1'
                  )}
                >
                  <div className={TreeComponentClasses['list-item']}>
                    <div
                      {...(context.itemContainerWithoutChildrenProps as any)}
                      style={{ paddingLeft: `${(depth + 1) * 12}px` }}
                      className={classNames(
                        'rct-tree-item-title-container',
                        item.isFolder &&
                          'rct-tree-item-title-container-isFolder',
                        context.isSelected &&
                          'rct-tree-item-title-container-selected',
                        context.isExpanded &&
                          'rct-tree-item-title-container-expanded',
                        context.isFocused &&
                          'rct-tree-item-title-container-focused',
                        context.isDraggingOver &&
                          'rct-tree-item-title-container-dragging-over',
                        context.isSearchMatching &&
                          'rct-tree-item-title-container-search-match'
                      )}
                    >
                      {arrow}
                      <InteractiveComponent
                        type={type}
                        {...(context.interactiveElementProps as any)}
                        className={classNames(
                          'rct-tree-item-button',
                          item.isFolder && 'rct-tree-item-button-isFolder',
                          context.isSelected && 'rct-tree-item-button-selected',
                          context.isExpanded && 'rct-tree-item-button-expanded',
                          context.isFocused && 'rct-tree-item-button-focused',
                          context.isDraggingOver &&
                            'rct-tree-item-button-dragging-over',
                          context.isSearchMatching &&
                            'rct-tree-item-button-search-match'
                        )}
                      >
                        <div>
                          <div
                            className={classNames(
                              'font-sans',
                              depth === 0
                                ? 'text-2xl font-semibold'
                                : depth === 1
                                ? 'text-xl font-normal'
                                : 'text-lg'
                            )}
                          >
                            <div
                              className={classNames(
                                'flex items-center',
                                TreeComponentClasses['list-item']
                              )}
                            >
                              {depth !== 0 &&
                              item.children?.length === 0 &&
                              valueAddedItems
                                .map((v) => v.index)
                                .includes(item.index) ? (
                                <div
                                  onClick={() =>
                                    handleAddValue(item.index, item.data.value)
                                  }
                                >
                                  <ToggleOffInputIcon width={30} height={30} />
                                </div>
                              ) : (
                                depth !== 0 &&
                                item.children?.length === 0 && (
                                  <div
                                    className={
                                      TreeComponentClasses['list-item__control']
                                    }
                                    onClick={() =>
                                      handleAddValue(
                                        item.index,
                                        item.data.value
                                      )
                                    }
                                  >
                                    <ToggleOnInputIcon width={30} height={30} />
                                  </div>
                                )
                              )}
                              <p
                                className={
                                  item.data.value === '0.00'
                                    ? 'line-through'
                                    : ''
                                }
                              >
                                {title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </InteractiveComponent>
                    </div>
                    {valueAddedItems.map((v) => v.index).includes(item.index) &&
                      depth !== 0 &&
                      item.children?.length === 0 && (
                        <div
                          className={classNames(
                            'rct-tree-item-button',
                            'py-2',
                            '!mt-4'
                          )}
                        >
                          <input
                            key={item.index}
                            className={`px-10 font-sans w-full block placeholder:text-base border-2 rounded-md py-1.5' text-[1.2rem] text-stak-dark-gray border-stak-light-gray bg-stak-white`}
                            value={
                              valueAddedItems.find((v) => v.index == item.index)
                                ?.value || item.data.value
                            }
                            onChange={(e) => {
                              handleChangeValue(e.target.value, item.index);
                            }}
                            onBlur={() => {}}
                          />
                        </div>
                      )}
                  </div>
                  {children}
                </li>
              );
            }}
          >
            <Tree
              treeId="tree-costcode"
              rootItem="root"
              treeLabel="Cost Code Data Tree"
            />
          </ControlledTreeEnvironment>
        )}
      </div>
    </Card>
  );
}

// const InputToggleOnOff = (props: Props) => {
//   const {
//     icon,
//     input,
//     showError,
//     actions,
//     form,
//     classes: addOnClass,
//   } = props;

//   const toggleClickHandler = (
//     e: React.MouseEvent<HTMLButtonElement>,
//     toggleType: "on" | "off",
//     id: string
//   ) => {
//     e.preventDefault();
//   };

//   const isRequired = input?.required;

//   // currently only showing the currency icon on theleft of the input, but add others here as an || conditional
//   const isLeftIcon = input.isCurrency;
//   const isRightIcon = !input.isCurrency;

//   return (
//     <div className={`${classes["input-container"]} ${addOnClass}`}>
//       <div className="flex items-center -ml-9 gap-2">
//         <div className={`flex pb-1 ${classes["toggle-buttons"]}`}>
//           <button
//             onClick={(e) => {
//               toggleClickHandler(e, "on", input.id);
//             }}
//           >
//             <ToggleOnInputIcon width={30} height={30} />
//           </button>
//         </div>
//         <div className={`flex pb-1 ${classes["toggle-buttons"]}`}>
//           <button
//             onClick={(e) => {
//               toggleClickHandler(e, "off", input.id);
//             }}
//           >
//             <ToggleOffInputIcon width={30} height={30} />
//           </button>
//         </div>
//         <label
//           className={`font-sans font-semibold text-md  ${"line-through"}`}
//           htmlFor={input.id}
//         >
//           {`${(+input.id).toFixed(3)} - ${input.label}`}
//         </label>
//       </div>
//       <div className="relative w-full mt-1">
//         {isLeftIcon && icon && (
//           <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
//             {icon}
//           </div>
//         )}
//         <div className="flex flex-row gap-2">
//           <input
//             className={`font-sans w-full block placeholder:text-base border-2 text-gray-700 rounded-md py-1.5' ${
//               isLeftIcon
//                 ? "pl-10"
//                 : isRightIcon && isError && isRequired
//                 ? "pr-10"
//                 : "px-3"
//             } ${classes["input-container__input"]} ${
//               isRequired
//                 ? "border-red-500 placeholder:text-red-500"
//                 : "border-stak-light-gray"
//             }`}
//             value={
//               input.value ||
//               (input.isCurrency
//                 ? formatNumber(inputValue as string)
//                 : inputValue)
//             }
//             id={input.id}
//             type={input.type as string}
//             data-testid={input["data-testid"]}
//             onChange={
//               changeHandler as (e: React.ChangeEvent<HTMLInputElement>) => void
//             }
//             onBlur={blurHandler as () => void}
//           />
//         </div>
//         {isRequired && (
//           <div
//             data-testid="error-icon-div"
//             className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
//           >
//             <ExclamationCircleIcon
//               className="h-5 w-5 text-red-500"
//               aria-hidden="true"
//             />
//           </div>
//         )}
//         {isRightIcon && icon && (
//           <div
//             className={`pointer-events-none absolute inset-y-0 right-0 flex items-center ${
//               isRequired ? "pr-10" : "pr-3"
//             }`}
//           >
//             {icon}
//           </div>
//         )}
//       </div>
//       {isRequired && (
//         <p
//           className="font-sans mt-2 text-sm text-red-600"
//           id={`${input.id}-error-message`}
//         >
//           {input.errormessage}
//         </p>
//       )}
//     </div>
//   );
// };
