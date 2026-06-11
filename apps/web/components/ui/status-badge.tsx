type Status =
  | "draft" | "submitted" | "inspection" | "verifying" | "changes"
  | "approved" | "published" | "reserved" | "sold"
  | "rejected" | "delisted" | "verified";

const STATUS_CONFIG: Record<Status, { label: string; dot: string; bg: string; text: string }> = {
  draft:      { label: "Draft",        dot: "#8089A3", bg: "#F5F6FA", text: "#5B6480" },
  submitted:  { label: "Submitted",    dot: "#FFC72C", bg: "#FFF1B8", text: "#C99100" },
  inspection: { label: "Inspection",   dot: "#F47B20", bg: "#FDE6CD", text: "#B45309" },
  verifying:  { label: "Verifying",    dot: "#FFC72C", bg: "#FFF1B8", text: "#C99100" },
  changes:    { label: "Changes req.", dot: "#F47B20", bg: "#FDE6CD", text: "#B45309" },
  approved:   { label: "Approved",     dot: "#1F7A4C", bg: "#D6EBDD", text: "#1F7A4C" },
  published:  { label: "Published",    dot: "#1F7A4C", bg: "#D6EBDD", text: "#1F7A4C" },
  reserved:   { label: "Reserved",     dot: "#0A1E4D", bg: "#ECEEF4", text: "#1F2E5C" },
  sold:       { label: "Sold",         dot: "#0A1E4D", bg: "#D6DAE5", text: "#0A1E4D" },
  rejected:   { label: "Rejected",     dot: "#9B1C1C", bg: "#FBDCD2", text: "#9B1C1C" },
  delisted:   { label: "Delisted",     dot: "#8089A3", bg: "#F5F6FA", text: "#5B6480" },
  verified:   { label: "BiSell Verified", dot: "#1F7A4C", bg: "#D6EBDD", text: "#1F7A4C" },
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
