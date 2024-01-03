import React, { useCallback, useEffect, useState } from 'react';
import { useAgaveLink } from '@agave-api/react-agave-link';
import { useUser } from '@auth0/nextjs-auth0/client';

import { User } from '@/lib/models/formStateModels';
import Button from '../UI/Buttons/Button';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { uiActions } from '@/store/ui-slice';
import { companyDataActions } from '@/store/company-data-slice';
import { updateVendorDocs } from '@/lib/utility/vendorHelpers';
import { Customers, Employees } from '@/lib/models/companyDataModel';
import { VendorSummary } from '@/lib/models/summaryDataModel';
import { UpdateDocData } from '@/lib/models/vendorModel';
import { CostCodesData } from '@/lib/models/budgetCostCodeModel';

interface Props {
  softwareName: string;
  className: string;
}

const AgaveLinkComponent = ({ softwareName, className }: Props) => {
  const [_message, setMessage] = useState<string>('');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { user, isLoading } = useUser();

  const dispatch = useDispatch();

  const reference_id =
    !isLoading && `${(user as User).user_metadata.companyId}:qbd`;

  const onSuccess = useCallback((publicToken: string) => {
    const sendPublicToken = async () => {
      dispatch(
        uiActions.setProcessingNotificationContent({
          content: 'Loading Quickbooks Data',
          openNotification: true,
        })
      );
      try {
        const response = await fetch(
          `/api/${
            (user as User).user_metadata.companyId
          }/post-agave-public-token`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_token: publicToken,
              software: softwareName,
            }),
          }
        );
        if (response.status !== 200) {
          throw new Error(
            `${response.status} - ${response.statusText} - Something went wrong with exchanging public token.`
          );
        }
        // TODO create a type for the return data
        const data = (await response.json()) as {
          message: string;
          employees: { [uuid: string]: Employees };
          customers: { [uuid: string]: Customers };
          agave_response_data: VendorSummary;
          update_doc_data: UpdateDocData;
          items: CostCodesData;
        };

        let successText = 'Account token and ';
        // 1. dispatch employees data
        if (data.employees) {
          successText = successText + 'employee, ';
          dispatch(
            companyDataActions.addEmployeeData({
              isUpdate: false,
              data: data.employees,
            })
          );
        }
        // 2. dispatch customer data
        if (data.customers) {
          successText = successText + 'customers, ';
          dispatch(
            companyDataActions.addCustomerData({
              isUpdate: false,
              data: data.customers,
            })
          );
        }
        // 3. dispatch vendor summary data
        if (data.agave_response_data) {
          successText = successText + 'vendors, ';
          dispatch(
            companyDataActions.addToVendorsSummaryData(data.agave_response_data)
          );
        }
        // 4 update any vendor docs
        updateVendorDocs({ dispatch, data: data.update_doc_data });
        // 5. load the init cost codes
        if (data.items) {
          successText = successText + 'cost codes ';
          dispatch(companyDataActions.addInitCostCodes(data.items));
        }
        successText = successText + 'saved successfully.';
        dispatch(uiActions.notify({ content: successText, icon: 'success' }));
      } catch (error: any) {
        dispatch(uiActions.notify({ content: error.message, icon: 'error' }));
      } finally {
        dispatch(
          uiActions.setProcessingNotificationContent({
            openNotification: false,
          })
        );
      }
    };
    sendPublicToken();
  }, []);

  //TODO change this to an error modal perhaps?
  const onExit = useCallback((error: any) => {
    setMessage(error ? 'Error: ' + error : 'User closed Agave Link');
  }, []);

  useEffect(() => {
    const getAgaveLinkToken = async () => {
      const agaveResponse = await fetch(
        `/api/${(user as User).user_metadata.companyId}/get-agave-link-token`,
        {
          method: 'POST',
          headers: {
            reference_id: reference_id as string,
          },
        }
      );
      if (agaveResponse.status !== 200) {
        throw new Error(
          `${agaveResponse.status} - ${agaveResponse.statusText} - Something went wrong with retrieving the link token from agave.`
        );
      }
      const agaveData = await agaveResponse.json();
      setLinkToken(agaveData.link_token);
    };
    if (reference_id) {
      getAgaveLinkToken();
    }
  }, [reference_id]);

  let sourceSystemId: string | null = null;
  if (softwareName.toLowerCase() === 'quickbooks desktop') {
    sourceSystemId = 'quick-books-desktop';
  } else {
    sourceSystemId = null;
  }

  const config = {
    referenceId: reference_id,
    linkToken: linkToken,
    showSandboxSourceSystems:
      process.env.NEXT_PUBLIC_STAK_NODE_ENV === 'development' ? true : false, // Only for local development
    showProductionSourceSystems: true,
    sourceSystem: sourceSystemId, // If you need to open a specific source system
    // sourceSystemEnvironment: 'sandbox',
    // category: 'accounting', // If you need to limit source systems to a specific category
    onSuccess,
    onExit,
  };

  const { openLink, isReady } = useAgaveLink(config);

  return (
    <>
      <Button
        disabled={!isReady}
        onClick={(e) => {
          e.preventDefault();
          openLink();
        }}
        buttonText={
          isReady ? `Integrate Stak with ${softwareName}` : 'Loading...'
        }
        className={className}
      />
    </>
  );
};

export default AgaveLinkComponent;
