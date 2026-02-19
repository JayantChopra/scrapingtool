import { Lead } from "./types";

export function exportLeadsToCSV(leads: Lead[], filename: string) {
  const headers = [
    "Name",
    "Company",
    "City",
    "Signal Type",
    "Source Link",
    "Explanation",
    "LinkedIn URL",
  ];

  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.company,
      lead.city,
      lead.signalType,
      lead.sourceLink,
      lead.explanation,
      lead.linkedinUrl,
    ]
      .map(escapeCSV)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
