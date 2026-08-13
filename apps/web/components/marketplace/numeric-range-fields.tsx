"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type RangeField = {
  ariaLabel: string;
  emptyLabel: string;
  id: string;
  label: string;
  name: string;
};

type NumericRangeFieldsProps = {
  formatOption: (value: number) => string;
  initialMaximum: string;
  initialMinimum: string;
  maximumField: RangeField;
  minimumField: RangeField;
  options: readonly number[];
  validateRange: (minimum: string, maximum: string) => boolean;
};

function RangeSelect({
  field,
  formatOption,
  isMinimum,
  onChange,
  options,
  oppositeValue,
  value,
}: {
  field: RangeField;
  formatOption: (value: number) => string;
  isMinimum: boolean;
  onChange: (value: string) => void;
  options: readonly number[];
  oppositeValue: string;
  value: string;
}) {
  const isDisabled = (option: number) =>
    Boolean(oppositeValue) &&
    (isMinimum ? option > Number(oppositeValue) : option < Number(oppositeValue));

  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.id}
        className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
      >
        {field.label}
      </Label>
      <Select
        id={field.id}
        name={field.name}
        value={value}
        aria-label={field.ariaLabel}
        className="h-11"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{field.emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option} disabled={isDisabled(option)}>
            {formatOption(option)}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function NumericRangeFields({
  formatOption,
  initialMaximum,
  initialMinimum,
  maximumField,
  minimumField,
  options,
  validateRange,
}: NumericRangeFieldsProps) {
  const [minimum, setMinimum] = useState(initialMinimum);
  const [maximum, setMaximum] = useState(
    validateRange(initialMinimum, initialMaximum) ? initialMaximum : "",
  );

  function changeMinimum(nextMinimum: string) {
    setMinimum(nextMinimum);
    if (!validateRange(nextMinimum, maximum)) setMaximum("");
  }

  function changeMaximum(nextMaximum: string) {
    setMaximum(nextMaximum);
    if (!validateRange(minimum, nextMaximum)) setMinimum("");
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <RangeSelect
        field={minimumField}
        formatOption={formatOption}
        isMinimum
        onChange={changeMinimum}
        options={options}
        oppositeValue={maximum}
        value={minimum}
      />
      <RangeSelect
        field={maximumField}
        formatOption={formatOption}
        isMinimum={false}
        onChange={changeMaximum}
        options={options}
        oppositeValue={minimum}
        value={maximum}
      />
    </div>
  );
}
