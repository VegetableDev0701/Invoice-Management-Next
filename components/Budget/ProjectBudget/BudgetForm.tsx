import React, { useState, useEffect } from 'react';
import {
  ControlledTreeEnvironment,
  Tree,
  TreeItem,
  TreeItemIndex,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

import {
  useAppSelector as useSelector,
  useAppDispatch as useDispatch,
} from '@/store/hooks';
import {
  addBudgetFormActions,
  initializeB2AChartDataThunk,
} from '@/store/add-budget-slice';
import { projectDataActions } from '@/store/projects-data-slice';

import scrollToElement from '@/lib/utility/scrollToElement';
import { formatNameForID } from '@/lib/utility/formatter';
import { formatNumber } from '@/lib/utility/formatter';
import { classNames } from '@/lib/utility/utils';
import { ConvertTreeData } from '@/lib/utility/treeDataHelpers';
import {
  CostCodeItem,
  CostCodesData,
  TreeData,
} from '@/lib/models/budgetCostCodeModel';

import Card from '@/components/UI/Card';
import classes from '../../Forms/InputFormLayout/FormLayout.module.css';
import inputClasses from '@/components/Inputs/Input.module.css';
import ToggleOffInputIcon from '@/public/icons/ToggleOffInput';
import ToggleOnInputIcon from '@/public/icons/ToggleOnInput';
import TreeComponentClasses from './BudgetForm.module.css';
import DollarSign from '@/public/icons/DollarSign';
import { useUser } from '@auth0/nextjs-auth0/client';
import { User } from '@/lib/models/formStateModels';

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
      number: '0',
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

  const { user, isLoading } = useUser();

  const isCollapsed = useSelector((state) => state.addBudgetForm.isCollapsed);
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [valueAddedItems, setValueAddedItems] = useState<
    Array<{
      index: TreeItemIndex;
      value: string;
    }>
  >([]);
  const [costCodeTreeDataList, setCostCodeTreeDataList] =
    useState<TreeData>(initTreeData);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isLoading) {
      setCompanyId((user as User).user_metadata.companyId);
    }
  }, [isLoading]);

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

    if (!valueAddedItems.length) {
      setValueAddedItems(
        Object.entries(treeData)
          .filter(
            ([_, value]) =>
              value.children?.length === 0 &&
              (value.data as CostCodeItem).value != '0.00'
          )
          .map(([key, value]) => ({
            index: key as TreeItemIndex,
            value: (value.data as CostCodeItem).value || '',
          }))
      );
    }

    const total = convertTreeData.getTotalBudget(treeData);
    dispatch(
      addBudgetFormActions.setFormElement({
        total: total.toFixed(2),
        divisionTotals: {},
        subDivisionTotals: {},
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
        return (
          itemData.data.number.toString().padStart(2, '0') +
          ' - ' +
          itemData.data.name +
          ' $' +
          formatNumber(itemData.data.value)
        );
      } else {
        return (
          itemData.data.number.toString().padStart(2, '0') +
          ' - ' +
          itemData.data.name
        );
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
        itemData.data.number +
        ' - ' +
        itemData.data.name +
        ' $' +
        formatNumber(itemData.data.value)
      );
    } else {
      return itemData.data.number + ' - ' + itemData.data.name;
    }
  };

  const reInitB2AData = () => {
    dispatch(
      initializeB2AChartDataThunk({
        projectId,
        companyId,
      })
    );
  };

  const handleAddValue = (treeItemIndex: TreeItemIndex, value: string) => {
    if (valueAddedItems.map((item) => item.index).includes(treeItemIndex)) {
      handleChangeValue(value, treeItemIndex);
      setValueAddedItems((prev) =>
        prev.filter((item) => item.index !== treeItemIndex)
      );
    } else {
      setValueAddedItems((prev) => [
        ...prev,
        { index: treeItemIndex, value: Number(value) ? value : '' },
      ]);
    }
    reInitB2AData();
  };

  const handleChangeValue = (value: string, treeItemIndex: TreeItemIndex) => {
    const updatedValueAddedItems = valueAddedItems.find(
      (v) => v.index === treeItemIndex
    );
    if (updatedValueAddedItems) {
      updatedValueAddedItems.value = formatNumber(value);
      setValueAddedItems([...valueAddedItems]);
    }

    const newTreeData = { ...costCodeTreeDataList };
    (newTreeData[treeItemIndex].data as CostCodeItem).value =
      formatNumber(value) || '0';
    const convertTreeData = new ConvertTreeData();
    convertTreeData.calculateCostCode(newTreeData);
    const total = convertTreeData.getTotalBudget(newTreeData);
    dispatch(
      addBudgetFormActions.setFormElement({
        total: total.toFixed(2),
        divisionTotals: {},
        subDivisionTotals: {},
      })
    );
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
            onSelectItems={(items) => setSelectedItems(() => [...items])}
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
              if (
                isCollapsed &&
                Number(item.data.value) === 0 &&
                !valueAddedItems.map((v) => v.index).includes(item.index)
              )
                return <></>;
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
                  <div
                    className={TreeComponentClasses['list-item']}
                    style={{
                      paddingLeft: `${
                        (depth + 1) * 12 +
                        (depth !== 0 && item.children?.length !== 0 ? 8 : 0)
                      }px`,
                    }}
                  >
                    <div
                      {...(context.itemContainerWithoutChildrenProps as any)}
                      className={classNames(
                        'rct-tree-item-title-container group',
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
                            'rct-tree-item-button-search-match',
                          depth !== 0 &&
                            item.children?.length === 0 &&
                            '!pl-0 z-50'
                        )}
                      >
                        <div
                          className={classNames(
                            'font-sans',
                            depth === 0
                              ? 'text-[1.35rem] font-semibold'
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
                            {depth !== 0 && item.children?.length === 0 && (
                              <div
                                className="opacity-0 group-hover:opacity-100 mr-2 transition-opacity"
                                style={{ minWidth: '30px' }}
                              >
                                {valueAddedItems
                                  .map((v) => v.index)
                                  .includes(item.index) ? (
                                  <div
                                    className="mb-[1px]"
                                    onClick={() =>
                                      handleAddValue(
                                        item.index,
                                        item.data.value
                                      )
                                    }
                                  >
                                    <ToggleOffInputIcon
                                      width={30}
                                      height={30}
                                    />
                                  </div>
                                ) : (
                                  depth !== 0 &&
                                  item.children?.length === 0 && (
                                    <div
                                      className="mb-[1px]"
                                      onClick={() =>
                                        handleAddValue(
                                          item.index,
                                          item.data.value
                                        )
                                      }
                                    >
                                      <ToggleOnInputIcon
                                        width={30}
                                        height={30}
                                      />
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            <p
                              className={
                                item.data.value === '0.00'
                                  ? 'text-stak-light-gray'
                                  : ''
                              }
                            >
                              {title}
                            </p>
                          </div>
                        </div>
                      </InteractiveComponent>
                    </div>
                    {valueAddedItems.map((v) => v.index).includes(item.index) &&
                      depth !== 0 &&
                      item.children?.length === 0 && (
                        <div className="relative shadow-sm !my-1 mr-2 ml-[30px]">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <DollarSign width={24} height={20} />
                          </div>
                          <input
                            type="text"
                            key={item.index}
                            className={`font-sans w-full block placeholder:text-base border-1 shadow-md pl-10 rounded-md py-1.5 ${inputClasses['input-container__input']}`}
                            value={
                              formatNumber(
                                valueAddedItems.find(
                                  (v) => v.index == item.index
                                )?.value as string
                              ) || ''
                            }
                            onChange={(e) => {
                              handleChangeValue(e.target.value, item.index);
                            }}
                            onBlur={reInitB2AData}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddValue(item.index, item.data.value);
                              }
                            }}
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
