"use client";

import { NumericRangeFields } from "@/components/marketplace/numeric-range-fields";
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
  return (
    <NumericRangeFields
      formatOption={formatMileage}
      initialMinimum={initialMinimum}
      initialMaximum={initialMaximum}
      minimumField={{
        id: `${idPrefix}-mileage-min`,
        name: "mileageMin",
        label: "Min km",
        ariaLabel: "Minimum mileage",
        emptyLabel: "Any min",
      }}
      maximumField={{
        id: `${idPrefix}-mileage-max`,
        name: "mileageMax",
        label: "Max km",
        ariaLabel: "Maximum mileage",
        emptyLabel: "Any max",
      }}
      options={mileageOptions(initialMinimum, initialMaximum)}
      validateRange={isMileageRangeValid}
    />
  );
}
