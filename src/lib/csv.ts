import { Lead } from "./types";

const HEADERS = [
  "Name",
  "Company",
  "City",
  "Signal Type",
  "Source Link",
  "Explanation",
];

function escapeCSV(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function leadToRow(lead: Lead): string {
  return [
    lead.name,
    lead.company,
    lead.city,
    lead.signalType,
    lead.sourceLink,
    lead.explanation,
  ]
    .map(escapeCSV)
    .join(",");
}

/** Generate CSV string from leads (works on both client and server) */
export function generateCSVString(leads: Lead[]): string {
  const rows = leads.map(leadToRow);
  return [HEADERS.join(","), ...rows].join("\n");
}

/** Client-side: trigger CSV download in browser */
export function exportLeadsToCSV(leads: Lead[], filename: string) {
  const csv = generateCSVString(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
