"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  localeDirection,
  translate,
  type AppLocale,
  type MessageKey,
  type MessageValues,
} from "@/lib/i18n";

type LocaleContextValue = {
  direction: ReturnType<typeof localeDirection>;
  locale: AppLocale;
  t: (key: MessageKey, values?: MessageValues) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: AppLocale;
}) {
  const value = useMemo<LocaleContextValue>(
    () => ({
      direction: localeDirection(locale),
      locale,
      t: (key, values) => translate(locale, key, values),
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within LocaleProvider");
  return value;
}
