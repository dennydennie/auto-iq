"use client";

import { NumericRangeFields } from "@/components/marketplace/numeric-range-fields";
import {
  formatPriceUsd,
  isPriceRangeValid,
  priceOptions,
} from "@/lib/catalogue-price";

export function PriceRangeFields({
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
      formatOption={formatPriceUsd}
      initialMinimum={initialMinimum}
      initialMaximum={initialMaximum}
      minimumField={{
        id: `${idPrefix}-price-min`,
        name: "priceMin",
        label: "Min USD",
        ariaLabel: "Minimum price",
        emptyLabel: "Any min",
      }}
      maximumField={{
        id: `${idPrefix}-price-max`,
        name: "priceMax",
        label: "Max USD",
        ariaLabel: "Maximum price",
        emptyLabel: "Any max",
      }}
      options={priceOptions(initialMinimum, initialMaximum)}
      validateRange={isPriceRangeValid}
    />
  );
}
