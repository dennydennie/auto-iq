type Status =
  | "draft" | "submitted" | "inspection" | "verifying" | "changes"
  | "approved" | "published" | "reserved" | "sold"
  | "rejected" | "delisted" | "verified";

const STATUS_CONFIG: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  draft:      { label: "Draft",        dot: "var(--ink-400)", bg: "var(--ink-50)", text: "var(--ink-500)" },
  submitted:  { label: "Submitted",    dot: "var(--amber)", bg: "var(--amber-soft)", text: "var(--amber-dark)" },
  inspection: { label: "Inspection",   dot: "var(--ember)", bg: "var(--pending-soft)", text: "var(--pending)" },
  verifying:  { label: "Verifying",    dot: "var(--amber)", bg: "var(--amber-soft)", text: "var(--amber-dark)" },
  changes:    { label: "Changes req.", dot: "var(--ember)", bg: "var(--pending-soft)", text: "var(--pending)" },
  approved:   { label: "Approved",     dot: "var(--verified)", bg: "var(--verified-soft)", text: "var(--verified)" },
  published:  { label: "Published",    dot: "var(--verified)", bg: "var(--verified-soft)", text: "var(--verified)" },
  reserved:   { label: "Reserved",     dot: "var(--ink-900)", bg: "var(--ink-100)", text: "var(--ink-700)" },
  sold:       { label: "Sold",         dot: "var(--ink-900)", bg: "var(--ink-200)", text: "var(--ink-900)" },
  rejected:   { label: "Rejected",     dot: "var(--reject)", bg: "var(--reject-soft)", text: "var(--reject)" },
  delisted:   { label: "Delisted",     dot: "var(--ink-400)", bg: "var(--ink-50)", text: "var(--ink-500)" },
  verified:   { label: "BiSell Verified", dot: "var(--verified)", bg: "var(--verified-soft)", text: "var(--verified)" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className="badge" style={{ background: cfg.bg, color: cfg.text }}>
      <span className="badge-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}
