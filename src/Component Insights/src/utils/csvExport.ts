import type { ComponentInfo, ExportRow } from "@/types";

/**
 * Converts ComponentInfo[] to CSV string and triggers download.
 */
export function exportComponentsToCSV(
  components: ComponentInfo[],
  pageName: string
): void {
  const rows: ExportRow[] = components.map((comp) => ({
    componentName: comp.componentName,
    placeholder: comp.placeholderKey,
    datasourcePath: comp.datasourcePath || "N/A",
    sharedCount: comp.datasourceUsageCount,
    variant: comp.variant,
    styles: comp.styles || "N/A",
    parameters: JSON.stringify(comp.parameters),
    status: comp.isDatasourceMissing
      ? "MISSING DATASOURCE"
      : !comp.isLocalDatasource
      ? "SHARED"
      : "OK",
  }));

  const headers = [
    "Component Name",
    "Placeholder",
    "Datasource Path",
    "Shared Count",
    "Variant",
    "Styles",
    "Parameters",
    "Status",
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      [
        quote(row.componentName),
        quote(row.placeholder),
        quote(row.datasourcePath),
        row.sharedCount,
        quote(row.variant),
        quote(row.styles),
        quote(row.parameters),
        quote(row.status),
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${pageName.replace(/\s+/g, "_")}_components_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function quote(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}
