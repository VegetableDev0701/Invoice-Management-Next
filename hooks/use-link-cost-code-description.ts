import { useEffect, useState } from 'react';

import { useAppSelector as useSelector } from '@/store/hooks';

import { Items, SelectMenuOptions } from '@/lib/models/formDataModel';

export default function useConnectDescriptionToCostCode({
  input,
  costCodeList,
  costCodeNameList,
}: {
  input: Items;
  costCodeList: SelectMenuOptions[];
  costCodeNameList: SelectMenuOptions[];
}) {
  const [selected, setSelected] = useState<{ label: string }>({ label: '' });
  const laborFormState = useSelector((state) => state.addLaborForm);
  const processInvoiceState = useSelector(
    (state) => state.addProcessInvoiceForm
  );
  const workItemNumber = input.id.split('-')[0];

  useEffect(() => {
    if (input.id.includes('-cost-code') || input.id.includes('-cost_code')) {
      if (
        laborFormState[`${workItemNumber}-work-description`] &&
        laborFormState[`${workItemNumber}-work-description`].value !== ''
      ) {
        const costCodeId = costCodeNameList.filter(
          (costCodeName: { id: number; label: string }) => {
            return (
              costCodeName.label ===
              laborFormState[`${workItemNumber}-work-description`]?.value
            );
          }
        )[0];
        setSelected({
          label: costCodeList.filter(
            (costCode: { id: number; label: string }) =>
              costCode.id === costCodeId.id
          )[0].label,
        });
      }
    }
  }, [laborFormState?.[`${workItemNumber}-work-description`]?.value]);

  useEffect(() => {
    if (input.id.includes('-cost-code') || input.id.includes('-cost_code')) {
      if (
        processInvoiceState[`${workItemNumber}-work-description`] &&
        processInvoiceState[`${workItemNumber}-work-description`].value !== ''
      ) {
        const costCodeId = costCodeNameList.filter(
          (costCodeName: { id: number; label: string }) => {
            return (
              costCodeName.label ===
              processInvoiceState[`${workItemNumber}-work-description`]?.value
            );
          }
        )[0];
        setSelected({
          label: costCodeList.filter(
            (costCode: { id: number; label: string }) =>
              costCode.id === costCodeId?.id
          )[0]?.label,
        });
      }
    }
  }, [processInvoiceState?.[`${workItemNumber}-work-description`]?.value]);

  useEffect(() => {
    if (input.id === 'cost-code' || input.id === 'cost_code') {
      if (
        processInvoiceState['work-description'] &&
        processInvoiceState['work-description'].value !== ''
      ) {
        const costCodeId = costCodeNameList.filter(
          (costCodeName: { id: number; label: string }) => {
            return (
              costCodeName.label ===
              processInvoiceState['work-description'].value
            );
          }
        )[0];
        setSelected({
          label: costCodeList.filter(
            (costCode: { id: number; label: string }) =>
              costCode.id === costCodeId?.id
          )[0]?.label,
        });
      }
    }
  }, [processInvoiceState?.['work-description']?.value]);

  useEffect(() => {
    if (
      input.id.includes('-work-description') ||
      input.id.includes('-work_description')
    ) {
      if (
        laborFormState[`${workItemNumber}-cost-code`] &&
        laborFormState[`${workItemNumber}-cost-code`].value !== ''
      ) {
        const costCodeId = costCodeList.filter(
          (costCode: { id: number; label: string }) => {
            return (
              costCode.label ===
              laborFormState[`${workItemNumber}-cost-code`]?.value
            );
          }
        )[0];

        setSelected({
          label: costCodeNameList.filter(
            (costCodeName: { id: number; label: string }) =>
              costCodeName.id === costCodeId?.id
          )[0]?.label,
        });
      }
    }
  }, [laborFormState?.[`${workItemNumber}-cost-code`]?.value]);

  useEffect(() => {
    if (
      input.id.includes('-work-description') ||
      input.id.includes('-work_description')
    ) {
      if (
        processInvoiceState[`${workItemNumber}-cost-code`] &&
        processInvoiceState[`${workItemNumber}-cost-code`].value !== ''
      ) {
        const costCodeId = costCodeList.filter(
          (costCode: { id: number; label: string }) => {
            return (
              costCode.label ===
              processInvoiceState[`${workItemNumber}-cost-code`]?.value
            );
          }
        )[0];

        setSelected({
          label: costCodeNameList.filter(
            (costCodeName: { id: number; label: string }) =>
              costCodeName.id === costCodeId?.id
          )[0]?.label,
        });
      }
    }
  }, [processInvoiceState?.[`${workItemNumber}-cost-code`]?.value]);

  useEffect(() => {
    if (input.id === 'work-description' || input.id === 'work_description') {
      if (
        processInvoiceState['cost-code'] &&
        processInvoiceState['cost-code'].value !== ''
      ) {
        const costCodeId = costCodeList.filter(
          (costCode: { id: number; label: string }) => {
            return (
              (+costCode.label).toFixed(4) ===
              (+(processInvoiceState['cost-code'].value as string)).toFixed(4)
            );
          }
        )[0];

        setSelected({
          label: costCodeNameList.filter(
            (costCodeName: { id: number; label: string }) =>
              costCodeName.id === costCodeId?.id
          )[0]?.label,
        });
      }
    }
  }, [processInvoiceState?.['cost-code']?.value]);

  return selected;
}
