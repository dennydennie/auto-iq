"use client";

import type { AdminOperationsReportDto } from "@auto-iq/contracts/admin";
import { Button } from "@/components/ui/button";

export function ReportDownloadButton({ report }: { report: AdminOperationsReportDto }) {
  function download() {
    const rows = reportRows(report);
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `auto-iq-operations-${report.range.from.slice(0, 10)}-${report.range.to.slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <Button variant="outline" onClick={download}>Download CSV</Button>;
}

function reportRows(report: AdminOperationsReportDto): Array<Array<string | number>> {
  const rows: Array<Array<string | number>> = [["Section", "Metric", "Value"]];
  for (const [section, metrics] of reportSections(report)) {
    for (const [metric, value] of Object.entries(metrics)) {
      rows.push([section, metric, value]);
    }
  }
  rows.push(["range", "from", report.range.from], ["range", "to", report.range.to]);
  return rows;
}

function reportSections(report: AdminOperationsReportDto) {
  return [
    ["users", report.users],
    ["listings", report.listings],
    ["viewings", report.viewings],
    ["notifications", report.notifications],
  ] as const;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
