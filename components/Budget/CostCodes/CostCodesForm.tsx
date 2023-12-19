import React, { useEffect, useRef, useState } from 'react';
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
import { companyDataActions } from '@/store/company-data-slice';

import { useKeyPressAction } from '@/hooks/use-save-on-key-press';

import scrollToElement from '@/lib/utility/scrollToElement';
import { formatNameForID } from '@/lib/utility/formatter';
import { classNames, generateTitle } from '@/lib/utility/utils';
import { ConvertTreeData } from '@/lib/utility/treeDataHelpers';
import {
  CostCodeItem,
  CostCodesData,
  TreeData,
} from '@/lib/models/budgetCostCodeModel';

import InputBaseAddItem from '@/components/Inputs/InputBaseAddDivision';
import Card from '@/components/UI/Card';
import ModalConfirm from '@/components/UI/Modal/ModalConfirm';
import classes from '@/components/Forms/InputFormLayout/FormLayout.module.css';
import {
  TrashIcon,
  DocumentPlusIcon,
  PencilIcon,
} from '@heroicons/react/20/solid';
import TreeComponentClasses from './CostCodesForm.module.css';
import { addBudgetFormActions } from '@/store/add-budget-slice';

export interface Props {
  formData: CostCodesData;
  setDataList: (data: CostCodesData) => void;
  clickedLink: string;
  anchorScrollElement: string;
  dummyForceRender: boolean;
}
const convertTreeData = new ConvertTreeData();
const initTreeData = {
  root: {
    index: 'root',
    data: {
      name: '',
      number: '0',
    },
  },
};

function CostCodeForm(props: Props) {
  const { setDataList, dummyForceRender, clickedLink, anchorScrollElement } =
    props;

  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    number: '',
  });
  const [addItemIndex, setAddItemIndex] = useState<string>('');
  const [removeItemIndex, setRemoveItemIndex] = useState<TreeItem>();
  const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [costCodeDataList, setCostCodeDataList] =
    useState<TreeData>(initTreeData);
  const [expandedItems, setExpandedItems] = useState<TreeItemIndex[]>([]);
  const [focusedItem, setFocusedItem] = useState<TreeItemIndex>();
  const [selectedItems, setSelectedItems] = useState<TreeItemIndex[]>([]);
  const treeDataList = useSelector((state) => state.data.treeData);

  const addItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToElement(clickedLink, anchorScrollElement, 'scroll-frame');
  }, [clickedLink, anchorScrollElement, dummyForceRender]);

  useEffect(() => {
    setCostCodeDataList({
      ...new ConvertTreeData().convertCostCode2TreeData(props.formData),
    });
  }, [props.formData]);

  useEffect(() => {
    const openedItems = Object.keys(costCodeDataList).filter(
      (treeItemIndex) =>
        treeItemIndex !== 'root' &&
        (costCodeDataList[treeItemIndex].data as Omit<CostCodeItem, 'subItems'>)
          ?.isOpened
    );
    setExpandedItems(openedItems);
  }, [costCodeDataList]);

  useKeyPressAction({ ref: addItemRef, keyName: 'Enter' });

  const saveData = (newCodeDataList: TreeData) => {
    const costCodeDataList =
      convertTreeData.convertTreeData2CostCode(newCodeDataList);
    setDataList(costCodeDataList);
    setCostCodeDataList(newCodeDataList);
    dispatch(
      companyDataActions.changeUpdateTreeStatus({
        updated: true,
        data: { ...newCodeDataList },
      })
    );
  };

  const handleDelete = (item: TreeItem) => {
    setOpenConfirmModal(true);
    setRemoveItemIndex(item);
  };

  const handleAddItem = (item: string) => {
    setAddItemIndex(item);
  };

  const handleSaveAddItem = (depth: number) => {
    if (!formData.name || !formData.number) {
      setIsError(true);
      return;
    }

    const newCodeDataList = { ...costCodeDataList };
    const maxItemIndex = Object.keys(costCodeDataList).reduce((a, b) =>
      parseInt(a.slice(4)) > parseInt(b.slice(4)) ? a : b
    );
    const newItem = `item${parseInt(maxItemIndex.slice(4)) + 1}`;
    if (depth === 0) {
      newCodeDataList[newItem] = {
        index: newItem,
        data: {
          name: formData.name,
          number: formData.number,
        },
        children: [],
      };
    } else {
      newCodeDataList[newItem] = {
        index: newItem,
        data: {
          name: formData.name,
          value: formData.name,
          number: formData.number,
          id: formData.number,
          type: 'text',
          required: false,
          isCurrency: true,
          inputType: 'toggleInput',
        },
        children: [],
      };
    }
    if (!newCodeDataList[addItemIndex].children?.length)
      newCodeDataList[addItemIndex].children = [];

    newCodeDataList[addItemIndex].children?.push(newItem);
    newCodeDataList[addItemIndex].children?.sort((a, b) => {
      if (
        (newCodeDataList[a].data as Omit<CostCodeItem, 'subItems'>)?.number >
        (newCodeDataList[b].data as Omit<CostCodeItem, 'subItems'>)?.number
      ) {
        return 1;
      }
      return -1;
    });
    newCodeDataList[addItemIndex].isFolder = true;
    setAddItemIndex('');
    setIsError(false);

    dispatch(
      addBudgetFormActions.addToUpdateBudgetList({
        type: 'Create',
        name: formData.name,
        number: formData.number,
        recursiveLevel: [
          ...(newCodeDataList[addItemIndex].data.recursiveLevel || []),
        ],
      })
    );
    saveData(newCodeDataList);
  };

  const changeHandler = (id: string, value: string) => {
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleConfirmDelete = () => {
    if (removeItemIndex) {
      const newCodeDataList = { ...costCodeDataList };

      dispatch(
        addBudgetFormActions.addToUpdateBudgetList({
          type: 'Delete',
          recursiveLevel: [
            ...(newCodeDataList[removeItemIndex.index.toString()].data
              .recursiveLevel || []),
          ],
        })
      );

      convertTreeData.removeCostCodeItem(removeItemIndex.index.toString());
      Object.keys(newCodeDataList).forEach((key) => {
        newCodeDataList[key].children = newCodeDataList[key].children?.filter(
          (itemData) => itemData !== removeItemIndex.index.toString()
        );
        newCodeDataList[key].isFolder =
          (newCodeDataList[key]?.children?.length ?? 0) > 0;
      });
      saveData(newCodeDataList);
    }
  };

  const getItemTitle = (item: TreeItem) => {
    const isDivision = costCodeDataList?.root?.children?.includes(item.index);
    let isSubDivision = false;
    costCodeDataList?.root?.children?.forEach((subDivision) => {
      if (costCodeDataList[subDivision].children?.includes(item.index)) {
        isSubDivision = true;
      }
    });
    const itemData = item;
    if (isDivision) {
      return (
        itemData.data.number.toString().padStart(2, '0') +
        ' - ' +
        itemData.data.name
      );
    } else if (isSubDivision) {
      if (itemData.data.name) {
        return itemData.data.number.toString() + ' - ' + itemData.data.name;
      }
    }
    return itemData.data.number + ' - ' + itemData.data.name;
  };

  const handleRenameItem = (item: TreeItem, name: string) => {
    const changeData = name.split('-');
    let newCodeDataList = { ...costCodeDataList };
    newCodeDataList = {
      ...costCodeDataList,
      [item.index]: {
        ...item,
        data: {
          ...item.data,
          name: changeData[1].trim(),
          number: Number(changeData[0].trim()),
        },
      },
    };
    setCostCodeDataList((prev) => ({
      ...prev,
      [item.index]: {
        ...item,
        data: {
          ...item.data,
          name: changeData[1].trim(),
          number: Number(changeData[0].trim()),
        },
      },
    }));
    convertTreeData.sortTreeDataByIndex(newCodeDataList);

    dispatch(
      addBudgetFormActions.addToUpdateBudgetList({
        type: 'Update',
        name: changeData[1].trim(),
        number: changeData[0].trim(),
        recursiveLevel: [
          ...(newCodeDataList[item.index].data.recursiveLevel || []),
        ],
      })
    );

    saveData(newCodeDataList);
  };

  return (
    <Card
      className={`${classes['parent-frame']} ${classes['parent-frame__form']} bg-stak-white`}
    >
      <div
        className="flex-grow flex-shrink flex flex-1 flex-col h-full self-stretch overflow-y-scroll"
        id="scroll-frame"
      >
        <ControlledTreeEnvironment
          items={costCodeDataList}
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
          canReorderItems={true}
          onFocusItem={(item) => setFocusedItem(item.index)}
          onSelectItems={(items) => setSelectedItems(() => [...items])}
          canRename={true}
          onRenameItem={handleRenameItem}
          onExpandItem={(item: TreeItem<any>) => {
            const newTreeData = { ...costCodeDataList };
            (
              newTreeData[item.index].data as Omit<CostCodeItem, 'subItems'>
            ).isOpened = true;
            setCostCodeDataList(newTreeData);
            dispatch(
              companyDataActions.changeUpdateTreeStatus({
                ...treeDataList,
                data: { ...newTreeData },
              })
            );
          }}
          onCollapseItem={(item) => {
            const newTreeData = { ...costCodeDataList };
            (
              newTreeData[item.index].data as Omit<CostCodeItem, 'subItems'>
            ).isOpened = false;
            setCostCodeDataList(newTreeData);
            dispatch(
              companyDataActions.changeUpdateTreeStatus({
                ...treeDataList,
                data: { ...newTreeData },
              })
            );
          }}
          renderItem={({ item, depth, children, title, context, arrow }) => {
            const InteractiveComponent = context.isRenaming ? 'div' : 'button';
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
                <div
                  {...(context.itemContainerWithoutChildrenProps as any)}
                  style={{ paddingLeft: `${(depth + 1) * 12}px` }}
                  className={classNames(
                    'rct-tree-item-title-container',
                    item.isFolder && 'rct-tree-item-title-container-isFolder',
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
                    <div className={TreeComponentClasses['list-item']}>
                      <div
                        className={classNames(
                          'font-sans',
                          'flex',
                          depth === 0
                            ? 'text-2xl font-semibold'
                            : depth === 1
                            ? 'text-xl font-normal'
                            : 'text-lg'
                        )}
                      >
                        {title}
                      </div>
                      <div
                        className={classNames(
                          TreeComponentClasses['list-item__control'],
                          context.isSelected &&
                            TreeComponentClasses['list-item__show']
                        )}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedItems((prev) => [
                              ...prev,
                              item.index.toString(),
                            ]);
                            handleAddItem(item.index.toString());
                          }}
                        >
                          <i
                            title={
                              depth === 0 ? 'Add SubDivision' : 'Add Cost Code'
                            }
                          >
                            <DocumentPlusIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </i>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                        >
                          <i title="Delete">
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                          </i>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            context.startRenamingItem();
                          }}
                        >
                          <i title="Edit">
                            <PencilIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </i>
                        </div>
                      </div>
                    </div>
                  </InteractiveComponent>
                </div>
                <div>
                  {item.index === addItemIndex && (
                    <div
                      className={`flex gap-2 items-end`}
                      style={{
                        paddingLeft: `${
                          (depth + 1) * 20 +
                          (depth !== 0 && item.children?.length !== 0 ? 8 : 0)
                        }px`,
                      }}
                    >
                      <InputBaseAddItem
                        classes="w-3/12"
                        showError={isError}
                        onChange={changeHandler}
                        input={{
                          label: 'Number',
                          id: `number`,
                          type: 'text',
                          inputmode: 'numeric',
                          value: '',
                          required: false,
                        }}
                      />
                      <InputBaseAddItem
                        classes="w-9/12"
                        showError={isError}
                        onChange={changeHandler}
                        input={{
                          label: 'Name',
                          id: 'name',
                          type: 'text',
                          value: '',
                          required: false,
                        }}
                      />

                      <div className="flex gap-2 mb-1">
                        <div
                          ref={addItemRef}
                          onClick={() => {
                            handleSaveAddItem(depth);
                            setFormData({
                              name: '',
                              number: '',
                            });
                          }}
                          className="rounded-full bg-stak-dark-green font-sans font-md focus:ring-0 focus-visible:outline-0 min-w-fit text-2xl font-normal px-3 py-1 flex items-center text-white"
                        >
                          Save
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddItemIndex('');
                            setFormData({
                              name: '',
                              number: '',
                            });
                            setIsError(false);
                          }}
                          className="rounded-full bg-stak-dark-green font-sans font-md focus:ring-0 focus-visible:outline-0 min-w-fit text-2xl font-normal px-3 py-1 flex items-center text-white"
                        >
                          Cancel
                        </div>
                      </div>
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
        <ModalConfirm
          message={`Are you sure to delete "${generateTitle(
            removeItemIndex?.data.number,
            removeItemIndex?.data.name
          )}"`}
          title="Delete"
          openModal={openConfirmModal}
          onCloseModal={() => setOpenConfirmModal(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </Card>
  );
}

export default CostCodeForm;
