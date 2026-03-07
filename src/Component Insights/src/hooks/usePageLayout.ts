"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  ComponentInfo,
  PageContextInfo,
  PlaceholderGroup,
  FilterType,
} from "@/types";
import {
  fetchRenderedLayout,
  parseLayoutToComponents,
  groupByPlaceholder,
} from "@/services/layoutService";
import { useComponentUsages } from "./useComponentUsages";
import type { ApplicationContext, PagesContext, XmcPagesContextViewTenantInfo, HostState } from "@sitecore-marketplace-sdk/client";

interface UsePageLayoutReturn {
  pageContext: PageContextInfo | null;
  pagesContext: PagesContext | undefined; // Raw PagesContext for accessing full pageInfo
  components: ComponentInfo[];
  placeholderGroups: PlaceholderGroup[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  filteredGroups: PlaceholderGroup[];
}

/**
 * Converts PagesContext from SDK to PageContextInfo for internal use
 */
function convertPagesContextToPageContextInfo(
  pagesContext: PagesContext | undefined,
  hostState: XmcPagesContextViewTenantInfo | null,
  appContext: ApplicationContext | undefined
): PageContextInfo | null {
  if (!pagesContext) return null;

  const pageInfo = pagesContext.pageInfo || {};
  const siteInfo = pagesContext.siteInfo || {};

  // Try to find sitecoreContextId from application context
  let sitecoreContextId = "";
  
  // Check application context for preview context ID
  if (appContext?.resourceAccess && Array.isArray(appContext.resourceAccess)) {
    const xmcResource = appContext.resourceAccess.find((r) => r.resourceId === "xmcloud");
    if (xmcResource?.context?.preview) {
      sitecoreContextId = xmcResource.context.preview;
    }
  }
  // Fallback to deprecated resources property
  else if (appContext?.resources && Array.isArray(appContext.resources)) {
    const xmcResource = appContext.resources.find((r) => r.resourceId === "xmcloud");
    if (xmcResource?.context?.preview) {
      sitecoreContextId = xmcResource.context.preview;
    }
  }

  return {
    itemId: pageInfo.id || "",
    itemName: pageInfo.name || pageInfo.displayName || "",
    itemPath: pageInfo.path || "",
    language: pageInfo.language || siteInfo.language || "en",
    siteName: siteInfo.name || "",
    sitecoreContextId: sitecoreContextId,
    environmentUrl: hostState?.url || undefined,
  };
}

export function usePageLayout(client: any): UsePageLayoutReturn {
  const [pagesContext, setPagesContext] = useState<PagesContext | undefined>();
  const [components, setComponents] = useState<ComponentInfo[]>([]);
  const [placeholderGroups, setPlaceholderGroups] = useState<PlaceholderGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [appContext, setAppContext] = useState<ApplicationContext | undefined>();
  const [hostState, setHostState] = useState<XmcPagesContextViewTenantInfo | null>(null);
  
  // Track the last loaded context to avoid duplicate loads
  const lastLoadedContextRef = useRef<string>("");
  // Track the last pagesContext to prevent unnecessary updates
  const lastPagesContextRef = useRef<PagesContext | undefined>();

  // Convert PagesContext to PageContextInfo for backward compatibility with services
  // Memoize to prevent infinite loops - only recalculate when dependencies change
  const pageContext = useMemo(
    () => convertPagesContextToPageContextInfo(pagesContext, hostState, appContext),
    [pagesContext, hostState, appContext]
  );

  // Usage enrichment hook - uses converted PageContextInfo
  const { enrichComponents } = useComponentUsages(client, pageContext);

  useEffect(() => {
    if (!client) return;

    if (typeof client.query === "function") {
      client.query("application.context")
        .then((res: ApplicationContext) => {
          const ctx = res?.data || res;
          setAppContext(ctx);
        })
        .catch(() => {
          // Ignore application context errors
        });
    }
  }, [client]);

  useEffect(() => {
    if (!client) return;

    if (typeof client.query === "function") {
      client.query("host.state", {
        subscribe: true,
        onSuccess: (res: HostState) => {
          const hostStateData = res as { xmCloudTenantInfo?: XmcPagesContextViewTenantInfo };
          if (hostStateData?.xmCloudTenantInfo) {
            setHostState(hostStateData.xmCloudTenantInfo);
          }
        },
      }).catch(() => {
        // Ignore host state errors
      });
    }
  }, [client]);

  const handleContextUpdate = useCallback(async (ctx: PagesContext) => {
    if (!ctx) return;

    const currentKey = `${ctx.pageInfo?.id || ""}-${ctx.pageInfo?.language || ""}`;
    const lastKey = lastPagesContextRef.current 
      ? `${lastPagesContextRef.current.pageInfo?.id || ""}-${lastPagesContextRef.current.pageInfo?.language || ""}`
      : "";
    
    if (currentKey === lastKey && currentKey !== "") {
      return;
    }

    let currentAppContext = appContext;
    if (!currentAppContext && client && typeof client.query === "function") {
      try {
        const res = await client.query("application.context");
        currentAppContext = (res?.data || res) as ApplicationContext;
        if (currentAppContext) {
          setAppContext(currentAppContext);
        }
      } catch {
        // Ignore application context errors
      }
    }

    lastPagesContextRef.current = ctx;
    setPagesContext(ctx);
  }, [appContext, client]);

  useEffect(() => {
    if (!client) return;

    if (typeof client.query === "function") {
      client.query("pages.context", {
        subscribe: true,
        onSuccess: (ctx: PagesContext) => {
          void handleContextUpdate(ctx);
        },
      }).catch(() => {
        // Ignore pages context errors
      });
    }
  }, [client]);


  const loadData = useCallback(async () => {
    const contextForService = convertPagesContextToPageContextInfo(pagesContext, hostState, appContext);
    
    if (!client || !contextForService) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const renderedLayout = await fetchRenderedLayout(client, contextForService);

      if (!renderedLayout) {
        setError("No layout data found. Make sure the page is published.");
        setIsLoading(false);
        return;
      }

      const presentationDetails = null;
      const parsed = parseLayoutToComponents(renderedLayout, presentationDetails);

      if (parsed.length === 0) {
        setError("No components found in the layout. The page may be empty.");
        setIsLoading(false);
        return;
      }

      let enriched: ComponentInfo[];
      try {
        enriched = await enrichComponents(parsed);
      } catch {
        enriched = parsed;
      }

      setComponents(enriched);
      setPlaceholderGroups(groupByPlaceholder(enriched));
    } catch (err: any) {
      console.error("[usePageLayout] Load failed:", err);
      setError(err?.message || "Failed to load component data.");
    } finally {
      setIsLoading(false);
    }
  }, [client, pagesContext, hostState, appContext, enrichComponents]);

  useEffect(() => {
    if (!pagesContext) return;
    
    if (!pageContext || !pageContext.itemId || !pageContext.sitecoreContextId) {
      return;
    }
    
    const contextKey = `${pageContext.itemId}-${pageContext.language}-${pageContext.sitecoreContextId}`;
    
    if (contextKey && contextKey !== lastLoadedContextRef.current) {
      lastLoadedContextRef.current = contextKey;
      void loadData();
    }

  }, [pagesContext, pageContext?.itemId, pageContext?.sitecoreContextId, pageContext?.language]);

  const filteredGroups = placeholderGroups
      .map((group) => ({
      ...group,
      components: group.components.filter((comp) => {
        const matchesSearch =
          !searchTerm ||
          comp.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.placeholderKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comp.datasourcePath.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        switch (activeFilter) {
          case "missing-datasource":
            matchesFilter = comp.isDatasourceMissing;
            break;
          case "shared-datasource":
            matchesFilter =
              !comp.isLocalDatasource && !comp.isDatasourceMissing;
            break;
          default:
            matchesFilter = true;
        }

        return matchesSearch && matchesFilter;
      }),
    }))
    .filter((group) => group.components.length > 0);

  return {
    pageContext,
    pagesContext,
    components,
    placeholderGroups,
    isLoading,
    error,
    refresh: loadData,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    filteredGroups,
  };
}
