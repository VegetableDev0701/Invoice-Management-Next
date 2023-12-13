import { useEffect } from 'react';
import { ResponseData } from './use-http';
import { useAppDispatch as useDispatch } from '@/store/hooks';
import { uiActions } from '@/store/ui-slice';
import { overlayActions } from '@/store/overlay-control-slice';
import { companyDataActions } from '@/store/company-data-slice';

interface Props {
  response: Response | null;
  successJSON: ResponseData | string | null;
  isOverlay: boolean;
  error?: string | null;
  overlayStateKey?: string;
}

export default function useSetNotification({
  response,
  successJSON,
  isOverlay,
  error,
  overlayStateKey,
}: Props) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (error) {
      dispatch(
        uiActions.setModalContent({
          openModal: true,
          message: error as string,
          title: 'Error',
        })
      );
    } else if (response) {
      if (response.ok) {
        dispatch(
          uiActions.notify({
            content: (successJSON as ResponseData).message,
            icon: 'success',
          })
        );
      }
      if (!response.ok) {
        if (isOverlay && overlayStateKey) {
          dispatch(
            overlayActions.setOverlayContent({
              data: { open: true },
              stateKey: overlayStateKey,
            })
          );
        }
        const message =
          'Something went wrong with the upload, please try again.';
        dispatch(
          uiActions.notify({
            content: message,
            icon: 'error',
          })
        );
      }
    }
  }, [response]);
}

export function useUploadVendorNotification({
  jsonResponse,
  response,
  isOverlay = true,
  overlayStateKey = 'vendors',
}: {
  jsonResponse?: {
    message: string;
    agave_uuid?: string;
    uuid?: string;
  };
  response: Response | null;
  isOverlay?: boolean;
  overlayStateKey?: string;
}) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (response && response.ok) {
      if (jsonResponse?.message && jsonResponse.message.includes('offline')) {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message: `Your Quickbooks Web Connector is not currently running, or 
            you are not logged into your Quickbooks Desktop account. Please 
            make sure to log in and open the Quickbooks Web Connector by navigating to 
            'File -> App Management -> Update Web Services' inside QuickBooks Desktop. 
            You have successfully saved this vendor to Stak, but it was not uploaded to Quickbooks.`,
            title: 'Not Logged into Quickbooks',
          })
        );
      } else if (
        jsonResponse?.message &&
        jsonResponse.message.includes('Account-Token')
      ) {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message: `Your Account-Token is invalid. Make sure you have integrated Stak with your 
            Quickbooks Desktop Account. You have successfully saved this vendor to Stak, 
            but it was not uploaded to Quickbooks.`,
            title: 'Invalid Account',
          })
        );
      } else if (
        jsonResponse?.message &&
        jsonResponse.message.includes('already exists')
      ) {
        dispatch(
          uiActions.setModalContent({
            openModal: true,
            message: jsonResponse.message,
            title: 'Duplicate Vendor',
          })
        );
      } else if (jsonResponse?.agave_uuid && jsonResponse?.uuid) {
        dispatch(
          companyDataActions.addAgaveUUIDToVendorSummary({
            agave_uuid: jsonResponse.agave_uuid,
            vendorId: jsonResponse.uuid,
          })
        );
        dispatch(
          uiActions.notify({
            content: jsonResponse.message,
            icon: 'success',
          })
        );
      } else {
        if (jsonResponse) {
          dispatch(
            uiActions.notify({
              content: jsonResponse.message,
              icon: 'success',
            })
          );
        }
      }
    } else if (response && !response.ok) {
      if (isOverlay && overlayStateKey) {
        dispatch(
          overlayActions.setOverlayContent({
            data: { open: true },
            stateKey: overlayStateKey,
          })
        );
        const message =
          'Something went wrong with saving vendor. Please try again.';
        dispatch(
          uiActions.notify({
            content: message,
            icon: 'error',
          })
        );
      }
    }
  }, [jsonResponse]);
}
