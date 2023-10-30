import { useState } from 'react';

import { formatNameForID } from '@/lib/utility/formatter';
import { MainCategories, ProjectFormData } from '@/lib/models/formDataModel';
import { Actions, FormData } from '@/lib/models/types';
import { FormState } from '@/lib/models/formStateModels';

import SideLinksCard from '../UI/FormLayout/SideLinksCard';
import TitleCard from '../UI/FormLayout/TitleCard';
import Form from './InputFormLayout/Form';

export interface Props {
  formData: FormData;
  formState: FormState;
  pageTitle: string;
  subTitle?: string;
  showError: boolean;
  actions: Actions;
  form: string;
  onOpenModal: () => void;
}

export default function FormComponent(props: Props) {
  const { formData, formState, pageTitle, subTitle, showError, actions, form } =
    props;
  const anchorScrollElement = formatNameForID(formData.mainCategories[0].name);

  // HACK - This is just dummy state to force this componenet to rerender
  // at EVERY side link click. This fixed a bug where if the same
  // link was clicked twice it would not scroll in the FormCard component.
  const [state, setState] = useState(false);
  const [clickedLinkId, setClickedLinkId] = useState('');

  const sideLinks = formData.mainCategories.map(
    (category: MainCategories) => category.name
  );

  const clickLinkHandler = (linkId: string) => {
    setState((prevState) => !prevState);
    setClickedLinkId(linkId);
  };

  return (
    <div className="main-form-tiles">
      <div className="mx-5">
        <TitleCard
          onConfirmSave={props.onOpenModal}
          pageTitle={pageTitle}
          subTitle={subTitle as string}
        />
      </div>
      <div className="content-tiles">
        <SideLinksCard sideLinks={sideLinks} onclicklink={clickLinkHandler} />
        <Form
          formData={formData as ProjectFormData}
          formState={formState}
          clickedLink={clickedLinkId}
          dummyForceRender={state}
          showError={showError}
          anchorScrollElement={anchorScrollElement}
          actions={actions}
          form={form}
        />
      </div>
    </div>
  );
}
