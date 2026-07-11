import type { LucideIcon } from "lucide-react";

export function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--amber-dark)]">
        {eyebrow}
      </p>
      <h2 className="display mt-3 text-3xl leading-tight text-[var(--ink-900)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--ink-500)] sm:text-base">
        {description}
      </p>
    </div>
  );
}

export function TrustItem({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <Icon
        className="mt-0.5 h-5 w-5 shrink-0 text-[var(--amber)]"
        aria-hidden="true"
      />
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-5 text-white/65">{description}</p>
      </div>
    </li>
  );
}

export function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--ink-100)] bg-white p-5 shadow-[0_18px_44px_-34px_rgba(10,30,77,0.4)]">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--amber)] text-sm font-bold text-[var(--ink-900)]">
        {number}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-[var(--ink-900)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--ink-500)]">
        {description}
      </p>
    </article>
  );
}
