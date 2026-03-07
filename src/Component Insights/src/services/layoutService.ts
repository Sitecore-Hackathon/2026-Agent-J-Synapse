import type {
  ComponentInfo,
  PageContextInfo,
  PresentationDetails,
  PlaceholderGroup,
} from "@/types";

// ──────────────────────────────────────────────
// Layout Service: Fetches and parses page layout data
// ──────────────────────────────────────────────

/**
 * Extended context that includes siteInfo for accessing rendering engine URL
 */
interface ExtendedPageContextInfo extends PageContextInfo {
  renderingEngineEndpointUrl?: string;
  layoutServiceConfig?: string;
}

/**
 * Fetches the rendered layout from XM Cloud via the Marketplace SDK.
 */
export async function fetchRenderedLayout(
  client: any,
  ctx: PageContextInfo | ExtendedPageContextInfo
): Promise<any> {
  if (!client || !ctx.sitecoreContextId) {
    return null;
  }

  const sitecoreContextId = ctx.sitecoreContextId;
  let routePath = ctx.itemPath;
    if (routePath.startsWith("/sitecore/content/")) {
    const parts = routePath.split("/").filter(p => p);
    if (parts.length >= 4) {
      let siteNameIndex = -1;
      for (let i = 3; i < parts.length - 1; i++) {
        if (parts[i] === ctx.siteName) {
          siteNameIndex = i;
          if (i + 1 < parts.length && parts[i + 1] === ctx.siteName) {
            siteNameIndex = i + 1;
          }
          break;
        }
      }
      
      if (siteNameIndex >= 0 && siteNameIndex + 1 < parts.length) {
        const itemParts = parts.slice(siteNameIndex + 1);
        if (itemParts.length > 0 && itemParts[0] === "Home") {
          itemParts.shift();
        }
        routePath = itemParts.length === 0 ? "/" : "/" + itemParts.join("/");
      } else if (parts.length > 3) {
        const lastPart = parts[parts.length - 1];
        routePath = lastPart === "Home" ? "/" : "/" + lastPart;
      }
    }
  }

  const payload = {
    query: `
      query GetLayout($siteName: String!, $routePath: String!, $language: String!) {
        layout(site: $siteName, routePath: $routePath, language: $language) {
          item {
            rendered
          }
        }
      }
    `,
    variables: {
      siteName: ctx.siteName,
      routePath: routePath,
      language: ctx.language || "en",
    },
  };

  try {
    const result = await executeSDKGraphQL(client, sitecoreContextId, payload);
    const data = result?.data || result;
    const rendered = data?.layout?.item?.rendered ?? null;
    return rendered;
  } catch (err) {
    console.error("[LayoutService] Failed to fetch rendered layout:", err);
    return null;
  }
}

/**
 * Parse the rendered layout JSON + PresentationDetails into ComponentInfo[].
 */
export function parseLayoutToComponents(
  renderedLayout: any,
  presentationDetails: PresentationDetails | null
): ComponentInfo[] {
  if (!renderedLayout?.sitecore?.route) {
    return [];
  }

  const route = renderedLayout.sitecore.route;
  const components: ComponentInfo[] = [];

  // Index renderings from presentation details by UID
  const renderingMap = new Map<string, any>();
  if (presentationDetails?.devices) {
    for (const device of presentationDetails.devices) {
      if (device.renderings) {
        for (const rendering of device.renderings) {
          if (rendering.instanceId) {
            renderingMap.set(rendering.instanceId, rendering);
          }
        }
      }
    }
  }

  // Components to exclude (page structure components)
  const excludedComponents = new Set([
    "PartialDesignDynamicPlaceholder",
    "Container",
    "ColumnSplitter",
    "RowSplitter",
  ]);

  // Recursively walk layout placeholders
  function walkPlaceholders(
    placeholders: Record<string, any[]>,
    parentPlaceholderPath: string = "",
    parentComponentParams: Record<string, string> | null = null
  ) {
    if (!placeholders || typeof placeholders !== "object") {
      return;
    }
    
    for (const [phKey, phComponents] of Object.entries(placeholders)) {
      if (!Array.isArray(phComponents)) {
        continue;
      }
      
      let resolvedPlaceholderKey = phKey;
      if ((phKey.includes("-{*}") || phKey.includes("{")) && parentComponentParams) {
        const dynamicPlaceholderId = extractParam(parentComponentParams, "DynamicPlaceholderId");
        if (dynamicPlaceholderId) {
          resolvedPlaceholderKey = phKey.replace(/\{[^}]*\}/g, dynamicPlaceholderId);
        }
      }
      
      // Build the full placeholder path for children
      const fullPlaceholderPathForChildren = parentPlaceholderPath 
        ? `${parentPlaceholderPath}/${resolvedPlaceholderKey}`
        : resolvedPlaceholderKey;
      
      for (const comp of phComponents) {
        const uid = comp.uid || comp.componentName || generateId();
        const presentationData = renderingMap.get(uid);
        const componentName = comp.componentName || "Unknown Component";

        // Get component params for potential use as parent params for children
        const compParams = mergeParams(comp.params, presentationData?.parameters);

        if (excludedComponents.has(componentName)) {
          if (comp.placeholders) {
            walkPlaceholders(comp.placeholders, fullPlaceholderPathForChildren, compParams);
          }
          continue;
        }

        const datasourcePath =
          comp.dataSource || presentationData?.dataSource || "";
        const isLocal = datasourcePath.startsWith("local:");

        // Use the resolved placeholder path for this component
        const componentInfo: ComponentInfo = {
          instanceId: uid,
          componentName: componentName,
          componentId: presentationData?.id || comp.componentName || "",
          placeholderKey: fullPlaceholderPathForChildren,
          datasourcePath: datasourcePath,
          datasourceId: comp.dataSource || "",
          isLocalDatasource: isLocal,
          isDatasourceMissing: !datasourcePath || datasourcePath.trim() === "",
          variant: extractParam(compParams, "FieldNames") || "Default",
          styles: extractParam(compParams, "Styles") || "",
          parameters: compParams,
          fields: comp.fields || {},
          componentUsageCount: 0,
          datasourceUsageCount: 0,
          componentUsagePages: [],
          datasourceUsagePages: [],
        };

        components.push(componentInfo);

        if (comp.placeholders) {
          walkPlaceholders(comp.placeholders, fullPlaceholderPathForChildren, compParams);
        }
      }
    }
  }

  if (route.placeholders) {
    walkPlaceholders(route.placeholders);
  }

  return components;
}

/**
 * Groups ComponentInfo[] by placeholder key in visual flow order.
 */
export function groupByPlaceholder(
  components: ComponentInfo[]
): PlaceholderGroup[] {
  const map = new Map<string, ComponentInfo[]>();

  for (const comp of components) {
    const existing = map.get(comp.placeholderKey) || [];
    existing.push(comp);
    map.set(comp.placeholderKey, existing);
  }

  // Define visual ordering priority
  const orderPriority: Record<string, number> = {
    "headless-header": 0,
    header: 0,
    navigation: 1,
    "headless-main": 2,
    main: 2,
    "main-content": 3,
    content: 3,
    sidebar: 4,
    "headless-footer": 5,
    footer: 5,
  };

  return Array.from(map.entries())
    .sort(([a], [b]) => {
      const pa = findPriority(a, orderPriority);
      const pb = findPriority(b, orderPriority);
      return pa - pb;
    })
    .map(([key, comps]) => ({
      placeholderKey: key,
      components: comps,
    }));
}


// ──────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────

function findPriority(
  key: string,
  priorities: Record<string, number>
): number {
  if (key in priorities) return priorities[key];
  for (const [pattern, priority] of Object.entries(priorities)) {
    if (key.toLowerCase().includes(pattern)) return priority;
  }
  return 3;
}

function extractParam(
  params: Record<string, string> | undefined,
  key: string
): string {
  if (!params) return "";
  if (params[key]) return params[key];
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(params)) {
    if (k.toLowerCase() === lowerKey) return v;
  }
  return "";
}

function mergeParams(
  ...sources: Array<Record<string, string> | undefined>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const source of sources) {
    if (source && typeof source === "object") {
      Object.assign(result, source);
    }
  }
  return result;
}

function generateId(): string {
  return `comp-${Math.random().toString(36).substring(2, 11)}`;
}

async function executeSDKGraphQL(
  client: any,
  sitecoreContextId: string,
  payload: { query: string; variables: Record<string, any> }
): Promise<any> {
  if (typeof client.mutate === "function") {
    try {
      const result = await client.mutate("xmc.preview.graphql", {
        params: {
          query: { sitecoreContextId },
          body: payload,
        },
      });
      return result?.data || result;
    } catch (err) {
      console.error("[LayoutService] GraphQL query failed:", err);
      throw err;
    }
  }

  if (typeof client.request === "function") {
    try {
      const result = await client.request({
        action: "xmc.preview.graphql",
        params: { sitecoreContextId, ...payload },
      });
      return result?.data || result;
    } catch (err) {
      console.error("[LayoutService] GraphQL request failed:", err);
      throw err;
    }
  }

  if (typeof client.invoke === "function") {
    try {
      const result = await client.invoke("xmc.preview.graphql", {
        sitecoreContextId,
        ...payload,
      });
      return result?.data || result;
    } catch (err) {
      console.error("[LayoutService] GraphQL invoke failed:", err);
      throw err;
    }
  }

  throw new Error("No compatible SDK method found (mutate/request/invoke)");
}
