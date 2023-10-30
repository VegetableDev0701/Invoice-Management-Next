import React, { useCallback, useEffect, useState } from 'react';
import { useAgaveLink } from '@agave-api/react-agave-link';
import { useUser } from '@auth0/nextjs-auth0/client';

import { User } from '@/lib/models/formStateModels';
import Button from '../UI/Buttons/Button';

interface Props {
  softwareName: string;
  className: string;
}

const AgaveLinkComponent = ({ softwareName, className }: Props) => {
  const [message, setMessage] = useState<string>('');
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { user, isLoading } = useUser();

  const reference_id =
    !isLoading && `${(user as User).user_metadata.companyId}:qbd`;

  const onSuccess = useCallback((publicToken: string) => {
    const sendPublicToken = async () => {
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

  /*
   * For a full list of available options, see https://docs.agaveapi.com/agave-link/component
   */

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
