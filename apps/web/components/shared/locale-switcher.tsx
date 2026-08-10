"use client";

import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n";
import { useLocale } from "@/components/shared/locale-provider";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const { locale, t } = useLocale();

  return (
    <form action="/api/locale" method="post" className="inline-flex items-center gap-2">
      <input type="hidden" name="returnTo" value={pathname} />
      <Languages className="h-4 w-4 text-[var(--ink-400)]" aria-hidden="true" />
      <label className={compact ? "sr-only" : "text-xs font-medium text-[var(--ink-500)]"}>
        {t("locale.label")}
        <select
          name="locale"
          defaultValue={locale}
          aria-label={t("locale.label")}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="ms-2 min-h-11 rounded-lg border border-[var(--ink-200)] bg-white px-2 text-sm text-[var(--ink-900)]"
        >
          {APP_LOCALES.map((value) => (
            <option key={value} value={value}>
              {t(`locale.${value}` as `locale.${AppLocale}`)}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
