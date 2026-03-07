"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComponentInfo, PageContextInfo, UsagePage } from "@/types";
import {
  fetchComponentUsages,
  fetchDatasourceUsages,
  batchFetchUsages,
} from "@/services/usageService";

interface UsageData {
  componentUsageCount: number;
  componentUsagePages: UsagePage[];
  datasourceUsageCount: number;
  datasourceUsagePages: UsagePage[];
}

interface UseComponentUsagesReturn {
  getUsageData: (componentId: string, datasourceId: string) => UsageData;
  isLoading: boolean;
  enrichComponents: (components: ComponentInfo[]) => Promise<ComponentInfo[]>;
}

/**
 * Hook that manages usage data fetching and caching for components.
 * Provides batch enrichment and per-component lookup.
 */
export function useComponentUsages(
  client: any,
  pageContext: PageContextInfo | null
): UseComponentUsagesReturn {
  const [usageCache, setUsageCache] = useState<Map<string, UsageData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Look up cached usage data for a component.
   */
  const getUsageData = useCallback(
    (componentId: string, datasourceId: string): UsageData => {
      const cacheKey = `${componentId}::${datasourceId}`;
      return (
        usageCache.get(cacheKey) || {
          componentUsageCount: 0,
          componentUsagePages: [],
          datasourceUsageCount: 0,
          datasourceUsagePages: [],
        }
      );
    },
    [usageCache]
  );

  /**
   * Batch-enrich an array of ComponentInfo with usage counts.
   * Deduplicates IDs and fetches in parallel, then caches results.
   */
  const enrichComponents = useCallback(
    async (components: ComponentInfo[]): Promise<ComponentInfo[]> => {
      if (!client || !pageContext || components.length === 0) {
        return components;
      }

      setIsLoading(true);

      try {
        // Use component names instead of component IDs for rendering usage lookup
        const componentNames = components.map((c) => c.componentName);
        const datasourceIds = components.map((c) => c.datasourceId);

        const { renderingUsages, datasourceUsages } = await batchFetchUsages(
          client,
          pageContext,
          componentNames,
          datasourceIds
        );

        // Build cache and enrich
        const newCache = new Map<string, UsageData>();
        const enriched = components.map((comp) => {
          // Use component name as key for rendering usage lookup
          const ru = renderingUsages.get(comp.componentName);
          const du = datasourceUsages.get(comp.datasourceId);

          const usageData: UsageData = {
            componentUsageCount: ru?.count ?? 0,
            componentUsagePages: ru?.pages ?? [],
            datasourceUsageCount: du?.count ?? 0,
            datasourceUsagePages: du?.pages ?? [],
          };

          // Use component name in cache key for consistency
          const cacheKey = `${comp.componentName}::${comp.datasourceId}`;
          newCache.set(cacheKey, usageData);

          return {
            ...comp,
            ...usageData,
          };
        });

        setUsageCache((prev) => {
          const merged = new Map(prev);
          newCache.forEach((value, key) => merged.set(key, value));
          return merged;
        });

        return enriched;
      } catch (err) {
        console.error("[useComponentUsages] Batch enrichment failed:", err);
        return components;
      } finally {
        setIsLoading(false);
      }
    },
    [client, pageContext]
  );

  // Clear cache when page context changes
  useEffect(() => {
    setUsageCache(new Map());
  }, [pageContext?.itemId]);

  return {
    getUsageData,
    isLoading,
    enrichComponents,
  };
}

/**
 * Hook for fetching usage data for a single component (on-demand).
 * Used when a user expands an accordion and we want fresh data.
 */
export function useSingleComponentUsage(
  client: any,
  pageContext: PageContextInfo | null,
  componentId: string,
  datasourceId: string,
  enabled: boolean = false
) {
  const [data, setData] = useState<UsageData>({
    componentUsageCount: 0,
    componentUsagePages: [],
    datasourceUsageCount: 0,
    datasourceUsagePages: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !client || !pageContext) return;

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      try {

        const [compResult, dsResult] = await Promise.all([
          componentId
            ? fetchComponentUsages(client, pageContext!, componentId)
            : Promise.resolve({ count: 0, pages: [] as UsagePage[] }),
          datasourceId
            ? fetchDatasourceUsages(client, pageContext!, datasourceId)
            : Promise.resolve({ count: 0, pages: [] as UsagePage[] }),
        ]);

        if (!cancelled) {
          setData({
            componentUsageCount: compResult.count,
            componentUsagePages: compResult.pages,
            datasourceUsageCount: dsResult.count,
            datasourceUsagePages: dsResult.pages,
          });
        }
      } catch {
        // Ignore fetch errors
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => {
      cancelled = true;
    };
  }, [client, pageContext, componentId, datasourceId, enabled]);

  return { ...data, isLoading };
}
