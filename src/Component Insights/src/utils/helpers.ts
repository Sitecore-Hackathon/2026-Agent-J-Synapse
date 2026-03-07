/**
 * Extracts the component "friendly name" from the full component name.
 * e.g. "ContentBlock" → "Content Block"
 */
export function humanizeComponentName(name: string): string {
  return name.replace(/([A-Z])/g, " $1").trim();
}

/**
 * Returns a short datasource label (last segment of path).
 */
export function shortenDatasource(path: string): string {
  if (!path) return "—";
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] || path;
}

/**
 * Returns placeholder display name.
 * e.g. "headless-main" → "Headless Main"
 */
export function humanizePlaceholder(key: string): string {
  return key
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/**
 * Checks if a string is a valid GUID format.
 */
export function isGuid(str: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(str);
}

/**
 * Extracts GUID from datasource string (could be GUID or path).
 */
export function extractDatasourceId(datasource: string): string | null {
  if (!datasource) return null;
  
  // If it's already a GUID, return it
  if (isGuid(datasource)) {
    return datasource;
  }
  
  // If it's a path, try to extract GUID from the end (sometimes paths end with GUID)
  const parts = datasource.split("/").filter(Boolean);
  const lastPart = parts[parts.length - 1];
  if (lastPart && isGuid(lastPart)) {
    return lastPart;
  }
  
  // Could not extract GUID
  return null;
}


/**
 * Builds a link to the Content Editor for an item.
 * @param itemId - The item GUID
 * @param language - The language code (e.g., "en")
 * @param version - The version number (default: 1)
 * @param pageContext - Optional page context that contains environmentUrl
 */
export function buildContentEditorUrl(
  itemId: string,
  language?: string,
  version: number = 1,
  pageContext?: { environmentUrl?: string } | null
): string {
  const params = new URLSearchParams();
  params.set("sc_bw", "1");
  params.set("fo", itemId);
  
  if (language) {
    params.set("la", language);
  }
  if (version) {
    params.set("vs", version.toString());
  }
  
  const queryString = params.toString();
  const host = pageContext?.environmentUrl || "";
  
  if (host) {
    return `${host}sitecore/shell/Applications/Content Editor.aspx?${queryString}`;
  }
  
  // Fallback to relative path if host not found
  return `/sitecore/shell/Applications/Content Editor.aspx?${queryString}`;
}

/**
 * Extracts variant name(s) from parameter value.
 * The variant is typically stored in the "FieldNames" parameter.
 * If it's "Default" or empty, return ["Default"].
 * Otherwise, return the actual variant name(s).
 */
export function extractVariantNames(paramValue: string): string[] {
  if (!paramValue || paramValue.trim() === "") return ["Default"];
  
  // If it's already "Default", return it
  if (paramValue === "Default") return ["Default"];
  
  // If it contains pipe-separated values (multiple variants)
  if (paramValue.includes("|")) {
    const variants = paramValue.split("|").filter(Boolean).map(v => v.trim());
    return variants.length > 0 ? variants : ["Default"];
  }
  
  // Return the variant name as-is
  return [paramValue.trim()];
}
