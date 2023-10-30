import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect } from 'react';

import { ContractState, getSignedUrlContract } from '@/store/contract-slice';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { InvoiceState, getSignedUrlInvoice } from '@/store/invoice-slice';

import { User } from '@/lib/models/formStateModels';

export const useInvoiceSignedUrl = (invoiceObj: InvoiceState) => {
  const { user, isLoading: userLoading } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userLoading && user && invoiceObj.clickedInvoice) {
      const currentUTCTime = new Date(
        new Date().toISOString().slice(0, -1)
      ).getTime();

      const docId = invoiceObj.clickedInvoice.doc_id;
      if (
        !invoiceObj.signedUrls[docId] ||
        Object.keys(invoiceObj.signedUrls[docId]).length === 0 ||
        currentUTCTime > +invoiceObj.signedUrls[docId].expiration * 1000
      ) {
        dispatch(
          getSignedUrlInvoice({
            companyId: (user as User).user_metadata.companyId,
            invoice: invoiceObj.clickedInvoice,
          })
        );
      }
    }
  }, [
    invoiceObj.clickedInvoice,
    invoiceObj.signedUrls,
    user,
    userLoading,
    dispatch,
  ]);
};

export const useContractSignedUrl = (
  contractObj: ContractState,
  projectId: string
) => {
  const { user, isLoading: userLoading } = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!userLoading && user && contractObj.clickedContract) {
      const currentUTCTime = new Date(
        new Date().toISOString().slice(0, -1)
      ).getTime();
      const uuid = contractObj.clickedContract.uuid;
      if (
        !contractObj.signedUrls[uuid] ||
        Object.keys(contractObj.signedUrls[uuid]).length === 0 ||
        currentUTCTime > +contractObj.signedUrls[uuid].expiration * 1000
      ) {
        dispatch(
          getSignedUrlContract({
            companyId: (user as User).user_metadata.companyId,
            projectId,
            contract: contractObj.clickedContract,
          })
        );
      }
    }
  }, [
    contractObj.clickedContract,
    contractObj.signedUrls,
    user,
    userLoading,
    dispatch,
  ]);
};
