"use client";

import { NumericRangeFields } from "@/components/marketplace/numeric-range-fields";
import { isYearRangeValid, yearOptions } from "@/lib/catalogue-year";

export function YearRangeFields({
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
      formatOption={String}
      initialMinimum={initialMinimum}
      initialMaximum={initialMaximum}
      minimumField={{
        id: `${idPrefix}-year-min`,
        name: "yearMin",
        label: "From",
        ariaLabel: "Year from",
        emptyLabel: "Any year",
      }}
      maximumField={{
        id: `${idPrefix}-year-max`,
        name: "yearMax",
        label: "To",
        ariaLabel: "Year to",
        emptyLabel: "Any year",
      }}
      options={yearOptions(initialMinimum, initialMaximum)}
      validateRange={isYearRangeValid}
    />
  );
}
