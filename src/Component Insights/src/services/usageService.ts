import type { PageContextInfo, UsagePage } from "@/types";
import { isGuid, extractDatasourceId } from "@/utils/helpers";

export interface UsageResult {
  count: number;
  pages: UsagePage[];
}

async function executeSDKGraphQL(
  client: any,
  sitecoreContextId: string,
  payload: { query: string; variables: Record<string, any> }
): Promise<any> {
  if (typeof client.mutate === "function") {
    try {
      const mutateParams = {
        params: {
          query: { sitecoreContextId },
          body: payload,
        },
      };
      
      const result = await client.mutate("xmc.preview.graphql", mutateParams);
      return result?.data || result;
    } catch (err) {
      console.error("[UsageService] GraphQL query failed:", err);
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
      console.error("[UsageService] GraphQL request failed:", err);
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
      console.error("[UsageService] GraphQL invoke failed:", err);
      throw err;
    }
  }

  throw new Error("No compatible SDK method found (mutate/request/invoke)");
}

async function searchRenderingIdByName(
  client: any,
  ctx: PageContextInfo,
  componentName: string
): Promise<string | null> {
  if (!componentName || !client) {
    return null;
  }

  try {
    const response = await executeSDKGraphQL(client, ctx.sitecoreContextId, {
      query: `
        query SearchRendering($name: String!) {
          search(
            where: {
              AND: [
                { name: "_name", value: $name, operator: EQ }
                { name: "_templates", value: "{04646A89-996F-4EE7-878A-FFDBF1F0EF0D}", operator: EQ }
              ]
            }
          ) {
            results {
              id
            }
          }
        }
      `,
      variables: {
        name: componentName,
      },
    });

    const data = response?.data || response;
    const results = data?.search?.results;
    
    if (results && results.length > 0) {
      return results[0].id;
    }

    return null;
  } catch (err) {
    console.error(`[UsageService] Failed to search for rendering ID:`, err);
    return null;
  }
}

export async function fetchComponentUsages(
  client: any,
  ctx: PageContextInfo,
  componentName: string
): Promise<UsageResult> {
  if (!componentName || !client) {
    return { count: 0, pages: [] };
  }

  try {
    const renderingId = await searchRenderingIdByName(client, ctx, componentName);
    
    if (!renderingId) {
      return { count: 0, pages: [] };
    }

    const response = await executeHorizonGraphQL(client, ctx.sitecoreContextId, {
      query: `
        query GetItemWithReferences($path: String!, $language: String!, $site: String!, $version: Int) {
          item(path: $path, language: $language, site: $site, version: $version) {
            id
            displayName
            name
            version
            language
            ...Workflow
            references {
              referrers {
                item {
                  id
                  displayName
                  name
                  version
                  language
                  ...Workflow
                  ... on Page {
                    presentationDetails
                    layoutEditingKind
                    route
                    url
                    __typename
                  }
                  siteItem {
                    id
                    displayName
                    __typename
                  }
                  __typename
                }
                field {
                  name
                  displayName
                  title
                  sectionName
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
        }
        
        fragment Workflow on Content {
          workflow {
            id
            displayName
            finalState
            canEdit
            warnings {
              id
              errorCode
              message
              __typename
            }
            icon
            commands {
              id
              displayName
              icon
              suppressComment
              __typename
            }
            __typename
          }
          isLatestPublishableVersion
          publishing {
            hasPublishableVersion
            isPublishable
            isAvailableToPublish
            __typename
          }
          __typename
        }
      `,
      variables: {
        path: renderingId,
        language: ctx.language || "en",
        site: ctx.siteName,
      },
    }, ctx);

    const itemData = response?.item;
    if (!itemData?.references?.referrers) {
      return { count: 0, pages: [] };
    }

    const referrers = itemData.references.referrers || [];

    const allPageReferrers = referrers
      .filter((ref: any) => {
        return ref.item?.__typename === "Page" || ref.item?.route !== undefined || ref.item?.url !== undefined;
      })
      .map((ref: any) => ({
        itemId: ref.item.id,
        itemName: ref.item.displayName || ref.item.name,
        itemPath: ref.item.path || `/${ref.item.route || ""}`,
        url: ref.item.url || ref.item.route || "",
        siteName: ref.item.siteItem?.displayName || "",
        fieldName: ref.field?.name || "",
        fieldDisplayName: ref.field?.displayName || "",
        fieldSectionName: ref.field?.sectionName || "",
        language: ref.item.language || "en",
        workflow: ref.item.workflow?.displayName || null,
      }));

    // Deduplicate by itemId - keep first occurrence
    const uniquePageReferrersMap = new Map<string, UsagePage>();
    for (const page of allPageReferrers) {
      if (!uniquePageReferrersMap.has(page.itemId)) {
        uniquePageReferrersMap.set(page.itemId, page);
      }
    }

    const pageReferrers = Array.from(uniquePageReferrersMap.values());

    return {
      count: pageReferrers.length,
      pages: pageReferrers,
    };
  } catch (err) {
    console.error(`[UsageService] Failed to fetch component usages:`, err);
    return { count: 0, pages: [] };
  }
}

export async function fetchDatasourceUsages(
  client: any,
  ctx: PageContextInfo,
  datasourceId: string
): Promise<UsageResult> {
  if (!datasourceId || !client) {
    return { count: 0, pages: [] };
  }

  try {
    let itemId = datasourceId;
    let itemPath = datasourceId;

    if (datasourceId.startsWith("/sitecore/content/")) {
      itemPath = datasourceId;
      try {
        const itemResponse = await executeHorizonGraphQL(client, ctx.sitecoreContextId, {
          query: `
            query GetItemByPath($itemPath: String!, $language: String!, $site: String!) {
              item(path: $itemPath, language: $language, site: $site) {
                id
                path
              }
            }
          `,
          variables: {
            itemPath: itemPath,
            language: ctx.language || "en",
            site: ctx.siteName,
          },
        }, ctx);
        if (itemResponse?.item?.id) {
          itemId = itemResponse.item.id;
        }
      } catch {
        // Ignore path resolution errors
      }
    } else if (!isGuid(datasourceId)) {
      const extractedId = extractDatasourceId(datasourceId);
      if (extractedId) {
        itemId = extractedId;
      }
    }

    const response = await executeHorizonGraphQL(client, ctx.sitecoreContextId, {
      query: `
        query GetItemWithReferences($path: String!, $language: String!, $site: String!, $version: Int) {
          item(path: $path, language: $language, site: $site, version: $version) {
            id
            displayName
            name
            version
            language
            ...Workflow
            references {
              referrers {
                item {
                  id
                  displayName
                  name
                  version
                  language
                  ...Workflow
                  ... on Page {
                    presentationDetails
                    layoutEditingKind
                    route
                    url
                    __typename
                  }
                  siteItem {
                    id
                    displayName
                    __typename
                  }
                  __typename
                }
                field {
                  name
                  displayName
                  title
                  sectionName
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
        }
        
        fragment Workflow on Content {
          workflow {
            id
            displayName
            finalState
            canEdit
            warnings {
              id
              errorCode
              message
              __typename
            }
            icon
            commands {
              id
              displayName
              icon
              suppressComment
              __typename
            }
            __typename
          }
          isLatestPublishableVersion
          publishing {
            hasPublishableVersion
            isPublishable
            isAvailableToPublish
            __typename
          }
          __typename
        }
      `,
      variables: {
        path: itemId,
        language: ctx.language || "en",
        site: ctx.siteName,
      },
    }, ctx);

    const itemData = response?.item;
    if (!itemData?.references?.referrers) {
      return { count: 0, pages: [] };
    }

    const referrers = itemData.references.referrers || [];

    const allPageReferrers = referrers
      .filter((ref: any) => {
        return ref.item?.__typename === "Page" || ref.item?.route !== undefined || ref.item?.url !== undefined;
      })
      .map((ref: any) => ({
        itemId: ref.item.id,
        itemName: ref.item.displayName || ref.item.name,
        itemPath: ref.item.path || `/${ref.item.route || ""}`,
        url: ref.item.url || ref.item.route || "",
        siteName: ref.item.siteItem?.displayName || "",
        fieldName: ref.field?.name || "",
        fieldDisplayName: ref.field?.displayName || "",
        fieldSectionName: ref.field?.sectionName || "",
        language: ref.item.language || "en",
        workflow: ref.item.workflow?.displayName || null,
      }));

    // Deduplicate by itemId - keep first occurrence
    const uniquePageReferrersMap = new Map<string, UsagePage>();
    for (const page of allPageReferrers) {
      if (!uniquePageReferrersMap.has(page.itemId)) {
        uniquePageReferrersMap.set(page.itemId, page);
      }
    }

    const pageReferrers = Array.from(uniquePageReferrersMap.values());

    return {
      count: pageReferrers.length,
      pages: pageReferrers,
    };
  } catch (err) {
    console.error(`[UsageService] Failed to fetch datasource usages:`, err);
    return { count: 0, pages: [] };
  }
}

export async function batchFetchUsages(
  client: any,
  ctx: PageContextInfo,
  componentNames: string[],
  datasourceIds: string[]
): Promise<{
  renderingUsages: Map<string, UsageResult>;
  datasourceUsages: Map<string, UsageResult>;
}> {
  const uniqueComponentNames = [...new Set(componentNames.filter(Boolean))];
  const uniqueDatasourceIds = [...new Set(datasourceIds.filter(Boolean))];

  const [renderingResults, datasourceResults] = await Promise.all([
    Promise.all(
      uniqueComponentNames.map(async (name) => {
        const result = await fetchComponentUsages(client, ctx, name);
        return [name, result] as const;
      })
    ),
    Promise.all(
      uniqueDatasourceIds.map(async (id) => {
        const result = await fetchDatasourceUsages(client, ctx, id);
        return [id, result] as const;
      })
    ),
  ]);

  return {
    renderingUsages: new Map(renderingResults),
    datasourceUsages: new Map(datasourceResults),
  };
}

export async function fetchContentTreeChildren(
  client: any,
  sitecoreContextId: string,
  parentPath: string
): Promise<
  Array<{ id: string; name: string; path: string; hasChildren: boolean }>
> {
  try {
    const response = await executeGraphQLViaSDK(client, sitecoreContextId, {
      query: `
        query GetChildren($itemPath: String!) {
          item(path: $itemPath, language: "en") {
            children {
              results {
                id
                name
                path
                hasChildren
                template {
                  name
                }
              }
            }
          }
        }
      `,
      variables: {
        itemPath: parentPath,
      },
    });

    return (response?.item?.children?.results || []).map((child: any) => ({
      id: child.id,
      name: child.name,
      path: child.path,
      hasChildren: child.hasChildren || false,
    }));
  } catch (err) {
    console.error(`[UsageService] Failed to fetch tree children:`, err);
    return [];
  }
}

async function getSitecoreToken() {
  const urlencoded = new URLSearchParams();
  urlencoded.append("audience", process.env.OAUTH_AUDIENCE || "https://api.sitecorecloud.io");
  urlencoded.append("grant_type", "client_credentials");
  urlencoded.append("client_id", process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "");
  urlencoded.append("client_secret", process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET || "");

  try {
    const response = await fetch("/api/auth/proxy-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlencoded,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token fetch failed: ${errorData.error}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("[UsageService] Error getting token:", error);
    throw error;
  }
}

async function executeHorizonGraphQL(
  client: any,
  sitecoreContextId: string,
  payload: { query: string; variables: Record<string, any> },
  ctx: PageContextInfo
): Promise<any> {
  try {
    const environmentUrl = ctx.environmentUrl;
    if (!environmentUrl) {
      throw new Error("environmentUrl is required for Horizon API queries");
    }

    const accessToken = await getSitecoreToken();
    
    if (!accessToken) {
      throw new Error("Failed to obtain OAuth access token");
    }

    const horizonUrl = `${environmentUrl}/sitecore/api/ssc/horizon/query/?sc_horizon=api&sc_headless_mode=api`;
    const operationNameMatch = payload.query.match(/query\s+(\w+)/);
    const operationName = operationNameMatch ? operationNameMatch[1] : "Query";

    const queryPayload = {
      operationName: operationName,
      variables: payload.variables,
      query: payload.query,
    };

    const response = await fetch("/api/horizon/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        horizonUrl: horizonUrl,
        accessToken: accessToken,
        queryPayload: queryPayload,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Horizon API proxy request failed: ${response.status} ${response.statusText}. ${errorData.error || ""}`
      );
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data || result;
  } catch (err) {
    console.error("[UsageService] Horizon API request failed:", err);
    throw err;
  }
}

async function executeGraphQLViaSDK(
  client: any,
  sitecoreContextId: string,
  payload: { query: string; variables: Record<string, any> }
): Promise<any> {
  try {
    if (typeof client.mutate === "function") {
      const result = await client.mutate("xmc.preview.graphql", {
        params: {
          query: {
            sitecoreContextId,
          },
          body: payload,
        },
      });
      return result?.data || result;
    }

    if (typeof client.request === "function") {
      const result = await client.request({
        action: "xmc.preview.graphql",
        params: {
          sitecoreContextId,
          ...payload,
        },
      });
      return result?.data || result;
    }

    if (typeof client.invoke === "function") {
      const result = await client.invoke("xmc.preview.graphql", {
        sitecoreContextId,
        ...payload,
      });
      return result?.data || result;
    }

    throw new Error("No compatible SDK method found (mutate/request/invoke)");
  } catch (err) {
    console.error("[UsageService] SDK GraphQL execution failed:", err);
    throw err;
  }
}
