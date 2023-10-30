import { useState } from "react";

import InputBaseAddDivision from "@/components/Inputs/InputBaseAddDivision";
import Button from "@/components/UI/Buttons/Button";
import { CostCodesData } from "./CostCodesTreeData";


interface Props {
  showForm: () => void;
  setCostCodeDataList: Function;
}

export default function AddDivisionForm({
  showForm,
  setCostCodeDataList,
}: Props) {
  const [isError, setIsError] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    name: "",
  });

  const submitFormHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData["name"] === "" || formData["number"] === "") {
      setIsError(true);
      return;
    }
    setCostCodeDataList((prev: CostCodesData) => ({
      ...prev,
      updated: true,
      divisions: [
        ...prev.divisions,
        {
          name: formData["name"],
          number: formData["number"],
          subdivisions: [],
          updated: true,
        },
      ].sort((a, b) => {
        if (a.number > b.number) return 1;
        return -1;
      }),
    }));

    showForm();
  };

  const changeHandler = (id: string, value: string) => {
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  return (
    <form onSubmit={submitFormHandler} className="flex flex-col gap-2">
      <div className="flex h-full gap-1">
        <InputBaseAddDivision
          classes="w-3/12"
          showError={isError}
          onChange={changeHandler}
          input={{
            label: "#",
            id: "number",
            type: "text",
            inputmode: "numeric",
            value: "",
            required: false,
          }}
        />
        <InputBaseAddDivision
          classes="w-9/12"
          showError={isError}
          onChange={changeHandler}
          input={{
            label: "Name",
            id: "name",
            type: "text",
            value: "",
            required: false,
          }}
        />
      </div>
      {/* Use this to show an error message across both inputs if needed. */}
      {/* {isError && (
        <p
          className="mt-2 text-sm text-red-600"
          id={`${input.id}-error-message`}
        >
          {input.errormessage}
        </p>
      )} */}
      <Button buttonText="Save" type="submit" className="text-2xl py-2" />
    </form>
  );
}
