import { ContractEntry } from '@/lib/models/summaryDataModel';
import {
  ContractsData,
  InputElementWithItems,
  MainCategories,
} from '../models/formDataModel';
import { formatDateForInput, snapshotCopy } from './utils';
export const convertContractEntry2FormData = ({
  data,
  baseForm,
}: {
  data: ContractEntry;
  baseForm: { mainCategories: MainCategories[] };
}) => {
  const result: ContractsData = {
    name: 'Contract Details',
    uuid: data.uuid,
    mainCategories: snapshotCopy(baseForm.mainCategories),
  };

  const { vendor, contractAmt, date } = data.summaryData;

  (
    result.mainCategories[0].inputElements[0] as InputElementWithItems
  ).items[0].value = vendor;
  (
    result.mainCategories[0].inputElements[1] as InputElementWithItems
  ).items[0].value = contractAmt;
  (
    result.mainCategories[0].inputElements[1] as InputElementWithItems
  ).items[1].value = formatDateForInput(`${date} 12:00:00`, true);

  return result;
};
