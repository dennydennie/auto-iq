"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  formatMileage,
  isMileageRangeValid,
  mileageOptions,
} from "@/lib/catalogue-mileage";

export function MileageRangeFields({
  idPrefix,
  initialMinimum,
  initialMaximum,
}: {
  idPrefix: string;
  initialMinimum: string;
  initialMaximum: string;
}) {
  const [minimum, setMinimum] = useState(initialMinimum);
  const [maximum, setMaximum] = useState(
    isMileageRangeValid(initialMinimum, initialMaximum) ? initialMaximum : "",
  );
  const options = mileageOptions(initialMinimum, initialMaximum);

  function changeMinimum(nextMinimum: string) {
    setMinimum(nextMinimum);
    if (!isMileageRangeValid(nextMinimum, maximum)) setMaximum("");
  }

  function changeMaximum(nextMaximum: string) {
    setMaximum(nextMaximum);
    if (!isMileageRangeValid(minimum, nextMaximum)) setMinimum("");
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}-mileage-min`}
          className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
        >
          Min km
        </Label>
        <Select
          id={`${idPrefix}-mileage-min`}
          name="mileageMin"
          value={minimum}
          aria-label="Minimum mileage"
          className="h-11"
          onChange={(event) => changeMinimum(event.target.value)}
        >
          <option value="">Any min</option>
          {options.map((value) => (
            <option
              key={value}
              value={value}
              disabled={Boolean(maximum) && value > Number(maximum)}
            >
              {formatMileage(value)}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}-mileage-max`}
          className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
        >
          Max km
        </Label>
        <Select
          id={`${idPrefix}-mileage-max`}
          name="mileageMax"
          value={maximum}
          aria-label="Maximum mileage"
          className="h-11"
          onChange={(event) => changeMaximum(event.target.value)}
        >
          <option value="">Any max</option>
          {options.map((value) => (
            <option
              key={value}
              value={value}
              disabled={Boolean(minimum) && value < Number(minimum)}
            >
              {formatMileage(value)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
