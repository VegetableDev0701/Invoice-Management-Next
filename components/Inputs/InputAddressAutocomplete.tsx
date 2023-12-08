import React, { useRef, useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

import { useAppDispatch as useDispatch } from '@/store/hooks';

import { getValidFunc } from '@/lib/validation/formValidation';
import { FormState } from '@/lib/models/formStateModels';
import { Actions } from '@/lib/models/types';
import { AddressItems, Items } from '@/lib/models/formDataModel';
import { fetchAPIKey } from '@/lib/utility/getAPIKeys';

import classesFormLayout from '../Forms/InputFormLayout/FormLayout.module.css';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';

import classes from './Input.module.css';

interface Props {
  input: AddressItems[];
  classes: string;
  showError: boolean;
  formState: FormState;
  actions: Actions;
}

const InputAddressAutocomplete = (props: Props) => {
  const { input, showError, formState, actions, classes: addOnClass } = props;
  const addressRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const refs = [addressRef, cityRef, stateRef, zipRef];

  const [mutatedAddress, setMutatedAddress] = useState<string | undefined>('');
  const [mutatedCity, setMutatedCity] = useState<string | undefined>('');
  const [mutatedState, setMutatedState] = useState<string | undefined>('');
  const [mutatedZip, setMutatedZip] = useState<string | undefined>('');

  const isError = !showError
    ? !formState[input[0].items[0].id]?.isValid &&
      formState[input[0].items[0].id]?.isTouched
    : !formState[input[0].items[0].id]?.isValid;
  const isRequired = input[0].items[0]?.required;

  const blurHandler = (i: number, j: number) => {
    if (addressRef.current) {
      dispatch(
        actions.setIsTouchedState({
          inputKey: input[i].items[j].id,
          isValid: getValidFunc(
            input[i].items[j].id,
            input[i].items[j].required
          )(addressRef.current.value),
          isTouched: true,
        })
      );
    }
  };

  const changeHandler = (i: number, j: number) => {
    if (addressRef.current) {
      dispatch(
        actions.setFormElement({
          inputValue: input[i].items[j].value,
          inputKey: input[i].items[j].id,
          isValid: getValidFunc(
            input[i].items[j].id,
            input[i].items[j].required
          )(addressRef.current.value),
        })
      );
    }
  };

  useEffect(() => {
    // prepopulate data if exists in object from database OR in the redux state
    if (addressRef.current) {
      const currentAddress = input[0].items[0].value as string;
      const currentAddressId = input[0].items[0].id;
      addressRef.current.value =
        currentAddress ||
        (formState?.[currentAddressId]?.value as string) ||
        mutatedAddress ||
        '';
      if (currentAddress || mutatedAddress) {
        dispatch(
          actions.setFormElement({
            inputValue: currentAddress || mutatedAddress,
            inputKey: input[0].items[0].id,
            isValid: getValidFunc(
              input[0].items[0]?.validFunc || input[0].items[0].id,
              input[0].items[0].required
            )(currentAddress || (mutatedAddress as string)),
          })
        );
      }
    }

    if (cityRef.current) {
      const currentCity = input[1].items[0].value as string;
      const currentCityId = input[1].items[0].id;
      cityRef.current.value =
        currentCity || (formState?.[currentCityId]?.value as string) || '';
      if (currentCity || mutatedCity) {
        dispatch(
          actions.setFormElement({
            inputValue: currentCity || mutatedCity,
            inputKey: input[1].items[0].id,
            isValid: getValidFunc(
              input[1].items[0]?.validFunc || input[1].items[0].id,
              input[1].items[0].required
            )(currentCity || (mutatedCity as string)),
          })
        );
      }
    }

    if (stateRef.current) {
      const currentState = input[1].items[1].value as string;
      const currentStateId = input[1].items[1].id;
      stateRef.current.value =
        currentState || (formState?.[currentStateId]?.value as string) || '';
      if (currentState || mutatedState) {
        dispatch(
          actions.setFormElement({
            inputValue: currentState || mutatedState,
            inputKey: input[1].items[1].id,
            isValid: getValidFunc(
              input[1].items[1]?.validFunc || input[1].items[1].id,
              input[1].items[1].required
            )(currentState || (mutatedState as string)),
          })
        );
      }
    }

    if (zipRef.current) {
      const currentZip = input[1].items[2].value as string;
      const currentZipId = input[1].items[2].id;
      zipRef.current.value =
        currentZip || (formState?.[currentZipId]?.value as string) || '';
      if (currentZip || mutatedZip) {
        dispatch(
          actions.setFormElement({
            inputValue: currentZip || mutatedZip,
            inputKey: input[1].items[2].id,
            isValid: getValidFunc(
              input[1].items[2]?.validFunc || input[1].items[2].id,
              input[1].items[2].required
            )(currentZip || (mutatedZip as string)),
          })
        );
      }
    }
  }, [mutatedAddress, mutatedCity, mutatedState, mutatedZip]);

  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAutocomplete = async () => {
      const apiKey = await fetchAPIKey('googleMapsAPIKey');
      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['places'],
      });
      await loader.load();
      const southWest = new google.maps.LatLng(42.0, -125.0); // Approximate southwest corner
      const northEast = new google.maps.LatLng(49.0, -111.0); // Approximate northeast corner
      const bounds = new google.maps.LatLngBounds(southWest, northEast);

      if (addressRef.current) {
        const autoCompleteInstance = new google.maps.places.Autocomplete(
          addressRef.current,
          {
            bounds: bounds,
            componentRestrictions: { country: 'us' },
          }
        );
        autoCompleteInstance.addListener('place_changed', () =>
          onPlaceChanged(autoCompleteInstance)
        );
        setAutocomplete(autoCompleteInstance);
      }
    };

    initializeAutocomplete();

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  // check if there are any mutations to the address fields done by a third party like chrome
  useEffect(() => {
    setMutatedAddress(addressRef?.current?.value);
    setMutatedCity(cityRef?.current?.value);
    setMutatedState(stateRef?.current?.value);
    setMutatedZip(zipRef?.current?.value);
  }, [
    addressRef?.current?.value,
    cityRef?.current?.value,
    stateRef?.current?.value,
    zipRef?.current?.value,
  ]);

  const onPlaceChanged = (autocomplete: google.maps.places.Autocomplete) => {
    const place = autocomplete.getPlace();
    const addressComponents = place.address_components;
    if (addressComponents) {
      const street_number = addressComponents.find((component) =>
        component.types.includes('street_number')
      );
      const route = addressComponents.find((component) =>
        component.types.includes('route')
      );
      const locality = addressComponents.find((component) =>
        component.types.includes('locality')
      );
      const administrative_area_level_1 = addressComponents.find((component) =>
        component.types.includes('administrative_area_level_1')
      );
      const postal_code = addressComponents.find((component) =>
        component.types.includes('postal_code')
      );
      if (addressRef.current) {
        addressRef.current.value = `${
          street_number ? street_number.long_name : ''
        } ${route ? route.long_name : ''}`.trim();
        dispatch(
          actions.setFormElement({
            inputValue: addressRef.current.value,
            inputKey: input[0].items[0].id,
            isValid: getValidFunc(
              input[0].items[0].id,
              input[0].items[0].required
            )(addressRef.current.value),
          })
        );
      }

      if (cityRef.current) {
        cityRef.current.value = locality ? locality.long_name : '';
        dispatch(
          actions.setFormElement({
            inputValue: cityRef.current?.value,
            inputKey: input[1].items[0].id,
            isValid: getValidFunc(
              input[1].items[0].id,
              input[1].items[0].required
            )(cityRef.current.value),
          })
        );
      }

      if (stateRef.current) {
        stateRef.current.value = administrative_area_level_1
          ? administrative_area_level_1.short_name
          : '';
        dispatch(
          actions.setFormElement({
            inputValue: stateRef.current.value,
            inputKey: input[1].items[1].id,
            isValid: getValidFunc(
              input[1].items[1].id,
              input[1].items[1].required
            )(stateRef.current.value),
          })
        );
      }

      if (zipRef.current) {
        zipRef.current.value = postal_code ? postal_code.long_name : '';
        dispatch(
          actions.setFormElement({
            inputValue: zipRef.current.value,
            inputKey: input[1].items[2].id,
            isValid: getValidFunc(
              input[1].items[2].id,
              input[1].items[2].required
            )(zipRef.current.value),
          })
        );
      }
    }
  };

  const inputClasses = `font-sans w-full block placeholder:text-base border-1 text-stak-dark-gray pr-3 pl-3 shadow-md ${
    classes['input-container__input']
  } ${
    isError && isRequired
      ? 'border-red-500 placeholder:text-red-500'
      : 'border-stak-light-gray'
  } ${input[0].items[0].isOnOverlay ? 'rounded-md py-1.5' : 'rounded-md'}`;

  return (
    <>
      {input.map((el, i) => {
        return (
          <div
            key={i}
            className={`${classesFormLayout['category-frame__input-frame']} ${addOnClass}`}
          >
            {el.items.map((item: Items, j) => {
              return (
                <div
                  key={`${i}${j}`}
                  className={`${classes['input-container']} ${addOnClass}`}
                >
                  <label
                    className={`font-sans ${
                      item.isOnOverlay
                        ? 'font-semibold text-md'
                        : 'font-semibold text-md'
                    }`}
                    htmlFor={item.id}
                  >
                    {item.label}
                  </label>
                  <div className="relative w-full mt-1 rounded-md shadow-sm">
                    <input
                      className={inputClasses}
                      ref={refs[i + j]}
                      type={item.type as string}
                      placeholder=""
                      id={item.id}
                      disabled={item.disabled}
                      inputMode={
                        item.inputmode as
                          | 'none'
                          | 'search'
                          | 'text'
                          | 'email'
                          | 'tel'
                          | 'url'
                          | 'numeric'
                          | 'decimal'
                          | undefined
                      }
                      onBlur={() => blurHandler(i, j)}
                      onChange={() => changeHandler(i, j)}
                    />
                    {isError && isRequired && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ExclamationCircleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </div>
                  {isError && isRequired && (
                    <p
                      className="font-sans mt-2 text-sm text-red-600"
                      id={`${item.id}-error-message`}
                    >
                      {input[0].items[0].errormessage}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

export default React.memo(InputAddressAutocomplete);
