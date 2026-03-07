// ──────────────────────────────────────────────
// Core domain types for Component Inspector
// ──────────────────────────────────────────────

export interface RenderingInstance {
  id: string;                    // Rendering item ID (component definition)
  instanceId: string;            // Unique instance on this page
  placeholderKey: string;        // e.g. "headless-main", "header"
  dataSource: string;            // e.g. "local:/Data/Hero-1" or absolute path
  parameters: Record<string, string>;
}

export interface PresentationDevice {
  id: string;
  layoutId: string;
  renderings: RenderingInstance[];
  placeholders: unknown[];
}

export interface PresentationDetails {
  devices: PresentationDevice[];
}

// Enriched component data (after merging layout + presentation)
export interface ComponentInfo {
  instanceId: string;
  componentName: string;
  componentId: string;           
  placeholderKey: string;
  datasourcePath: string;
  datasourceId: string;
  isLocalDatasource: boolean;
  isDatasourceMissing: boolean;
  variant: string;
  styles: string;
  parameters: Record<string, string>;
  fields: Record<string, unknown>;
  componentUsageCount: number;  
  datasourceUsageCount: number;  
  componentUsagePages: UsagePage[];
  datasourceUsagePages: UsagePage[];
}

export interface UsagePage {
  itemId: string;
  itemName: string;
  itemPath: string;
  url: string;
  siteName?: string;
  fieldName?: string;
  fieldDisplayName?: string;
  fieldSectionName?: string;
  language?: string;
  workflow?: string | null;
}

export interface PlaceholderGroup {
  placeholderKey: string;
  components: ComponentInfo[];
}

export interface PageContextInfo {
  itemId: string;
  itemName: string;
  itemPath: string;
  language: string;
  siteName: string;
  sitecoreContextId: string;
  environmentUrl?: string; 
}

// Filter state
export type FilterType =
  | "all"
  | "missing-datasource"
  | "shared-datasource";

// Fullscreen tree node
export interface TreeNode {
  id: string;
  name: string;
  path: string;
  hasChildren: boolean;
  children?: TreeNode[];
  isPage: boolean;
}
