# Complete SDK Integration Documentation

## Architecture Overview

The Component Inspector uses a multi-layered approach to integrate with the Sitecore Marketplace SDK:

1. **SDK Client Layer**: Initialization and lifecycle management
2. **Context Layer**: Page and application context retrieval
3. **Data Layer**: Layout and usage data fetching
4. **Subscription Layer**: Real-time update handling

## SDK Client Initialization

### Implementation Location
`src/hooks/useMarketplaceClient.ts`

### Initialization Flow

```typescript
import { ClientSDK } from "@sitecore-marketplace-sdk/client";

export function useMarketplaceClient() {
  const [client, setClient] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sdkClient = ClientSDK.init({});
      setClient(sdkClient);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SDK initialization failed");
    }
  }, []);

  return { client, isInitialized, error };
}
```

### Key Points
- SDK auto-detects the environment (XM Cloud Pages)
- No explicit configuration required
- Handles initialization errors gracefully
- Provides loading and error states

## Context Management

### Pages Context Integration

**Location**: `src/hooks/usePageLayout.ts`

**Implementation**:

```typescript
useEffect(() => {
  if (!client) return;

  client.query("pages.context", {
    subscribe: true,
    onSuccess: (ctx: PagesContext) => {
      handleContextUpdate(ctx);
    },
  });
}, [client]);
```

**Data Retrieved**:
- Page ID, name, path
- Language
- Site information
- Page metadata (created by, updated by, dates)

### Application Context Integration

**Purpose**: Extract `sitecoreContextId` for GraphQL queries

**Implementation**:

```typescript
useEffect(() => {
  if (!client) return;

  client.query("application.context")
    .then((res: ApplicationContext) => {
      const ctx = res?.data || res;
      // Extract sitecoreContextId from:
      // ctx.resourceAccess.find(r => r.resourceId === "xmcloud")?.context?.preview
      setAppContext(ctx);
    });
}, [client]);
```

**Critical Data**:
- `sitecoreContextId`: Required for all GraphQL queries in preview/edit mode
- Retrieved from `resourceAccess[].context.preview`

### Host State Integration

**Purpose**: Get environment URL for API calls

**Implementation**:

```typescript
useEffect(() => {
  if (!client) return;

  client.query("host.state", {
    subscribe: true,
    onSuccess: (res: HostState) => {
      const hostStateData = res as { xmCloudTenantInfo?: XmcPagesContextViewTenantInfo };
      if (hostStateData?.xmCloudTenantInfo) {
        setHostState(hostStateData.xmCloudTenantInfo);
      }
    },
  });
}, [client]);
```

**Data Retrieved**:
- Environment URL (e.g., `https://xmc-tenant.sitecorecloud.io`)
- Used for Content Editor links and API calls

## GraphQL Integration

### SDK GraphQL Method

**Location**: `src/services/layoutService.ts`

**Implementation**:

```typescript
async function executeSDKGraphQL(
  client: any,
  sitecoreContextId: string,
  payload: { query: string; variables: Record<string, any> }
): Promise<any> {
  if (typeof client.mutate === "function") {
    const result = await client.mutate("xmc.preview.graphql", {
      params: {
        query: { sitecoreContextId },
        body: payload,
      },
    });
    return result?.data || result;
  }
  // Fallback methods...
}
```

**Key Points**:
- Uses `xmc.preview.graphql` operation
- Requires `sitecoreContextId` in query params
- GraphQL payload in body
- Returns unwrapped data

### Layout Query

**Query Structure**:

```graphql
query GetLayout($siteName: String!, $routePath: String!, $language: String!) {
  layout(site: $siteName, routePath: $routePath, language: $language) {
    item {
      rendered
    }
  }
}
```

**Variables**:
- `siteName`: Site name from context
- `routePath`: Converted from item path (removes `/sitecore/content` prefix)
- `language`: Language from page context

**Response Structure**:
```json
{
  "layout": {
    "item": {
      "rendered": {
        "sitecore": {
          "route": {
            "placeholders": {
              "headless-main": [...]
            }
          }
        }
      }
    }
  }
}
```

## Real-time Subscriptions

### Layout Update Subscription

**Location**: `src/hooks/usePageLayout.ts`

**Implementation**:

```typescript
useEffect(() => {
  if (!client) return;

  let unsubscribeLayout: (() => void) | undefined;
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      if (!isLoadingRef.current && loadDataRef.current) {
        void loadDataRef.current();
      }
    }, 500); // Debounce
  }, []);

  if (typeof client.subscribe === "function") {
    unsubscribeLayout = client.subscribe("pages.content.layoutUpdated", handleRefresh);
  }

  return () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    if (typeof unsubscribeLayout === "function") {
      unsubscribeLayout();
    }
  };
}, [client, handleRefresh]);
```

**Key Features**:
- Debounced updates (500ms) to prevent rapid-fire refreshes
- Proper cleanup on unmount
- Guards against concurrent loading

### Field Update Subscription

Similar implementation for `pages.content.fieldsUpdated`:

```typescript
unsubscribeFields = client.subscribe("pages.content.fieldsUpdated", handleRefresh);
```

## Data Flow Diagram

```
┌─────────────────┐
│  XM Cloud Pages │
└────────┬────────┘
         │
         │ SDK Context
         ▼
┌─────────────────┐
│  SDK Client     │
│  Initialization │
└────────┬────────┘
         │
         ├──► pages.context (subscribe)
         ├──► application.context
         ├──► host.state (subscribe)
         │
         ▼
┌─────────────────┐
│  Context State  │
│  Management     │
└────────┬────────┘
         │
         │ sitecoreContextId
         ▼
┌─────────────────┐
│  GraphQL Query  │
│  Layout Data    │
└────────┬────────┘
         │
         │ rendered layout JSON
         ▼
┌─────────────────┐
│  Component      │
│  Parsing        │
└────────┬────────┘
         │
         │ ComponentInfo[]
         ▼
┌─────────────────┐
│  Usage          │
│  Enrichment     │
└────────┬────────┘
         │
         │ Enriched Components
         ▼
┌─────────────────┐
│  UI Rendering   │
└─────────────────┘
```

## Context Conversion

### PagesContext → PageContextInfo

**Location**: `src/hooks/usePageLayout.ts`

**Purpose**: Convert SDK types to internal types for services

**Implementation**:

```typescript
function convertPagesContextToPageContextInfo(
  pagesContext: PagesContext | undefined,
  hostState: XmcPagesContextViewTenantInfo | null,
  appContext: ApplicationContext | undefined
): PageContextInfo | null {
  if (!pagesContext) return null;

  const pageInfo = pagesContext.pageInfo || {};
  const siteInfo = pagesContext.siteInfo || {};

  // Extract sitecoreContextId
  let sitecoreContextId = "";
  if (appContext?.resourceAccess) {
    const xmcResource = appContext.resourceAccess.find(
      (r) => r.resourceId === "xmcloud"
    );
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
```

## Error Handling

### SDK Initialization Errors

```typescript
try {
  const sdkClient = ClientSDK.init({});
} catch (err) {
  // Log error and show user-friendly message
  setError("SDK initialization failed. Ensure you're running in XM Cloud Pages.");
}
```

### Query Errors

```typescript
try {
  const result = await client.query("pages.context");
} catch (err) {
  console.error("Context query failed:", err);
  // Fallback: show error state or retry
}
```

### Subscription Errors

```typescript
try {
  const unsubscribe = client.subscribe("pages.content.layoutUpdated", handler);
} catch (err) {
  console.error("Subscription failed:", err);
  // Continue without real-time updates
}
```

## Performance Optimizations

### 1. Memoization

```typescript
const pageContext = useMemo(
  () => convertPagesContextToPageContextInfo(pagesContext, hostState, appContext),
  [pagesContext, hostState, appContext]
);
```

### 2. Debouncing

```typescript
const handleRefresh = useCallback(() => {
  clearTimeout(refreshTimeoutRef.current);
  refreshTimeoutRef.current = setTimeout(() => {
    refreshData();
  }, 500);
}, []);
```

### 3. Loading Guards

```typescript
const isLoadingRef = useRef<boolean>(false);

if (isLoadingRef.current) {
  return; // Prevent concurrent loads
}
isLoadingRef.current = true;
```

### 4. Context Change Detection

```typescript
const lastPagesContextRef = useRef<PagesContext | undefined>();

if (lastPagesContextRef.current?.pageInfo?.id === ctx.pageInfo?.id &&
    lastPagesContextRef.current?.pageInfo?.language === ctx.pageInfo?.language) {
  return; // Skip if context hasn't actually changed
}
```

## Testing Considerations

### Mock SDK Client

```typescript
const mockClient = {
  query: jest.fn(),
  subscribe: jest.fn(),
  mutate: jest.fn(),
};
```

### Test Context Updates

```typescript
const mockPagesContext: PagesContext = {
  pageInfo: {
    id: "test-id",
    name: "Test Page",
    path: "/sitecore/content/Test/Home",
    language: "en",
  },
  siteInfo: {
    name: "TestSite",
    language: "en",
  },
};
```

## Troubleshooting Guide

### Issue: `sitecoreContextId` is empty

**Cause**: Application context not loaded or structure changed

**Solution**: 
- Verify `application.context` query succeeds
- Check `resourceAccess` structure
- Add fallback to deprecated `resources` property

### Issue: Subscriptions not working

**Cause**: Client not initialized or subscription method unavailable

**Solution**:
- Verify `client.subscribe` is a function
- Check SDK initialization completed
- Ensure proper cleanup

### Issue: Layout data not loading

**Cause**: Invalid `sitecoreContextId` or route path

**Solution**:
- Verify `sitecoreContextId` is non-empty
- Check route path conversion logic
- Validate GraphQL query structure

### Issue: Infinite refresh loops

**Cause**: Context updates triggering unnecessary re-renders

**Solution**:
- Implement context change detection
- Add loading guards
- Use debouncing for updates

## Best Practices Summary

1. ✅ Always check `isInitialized` before SDK operations
2. ✅ Handle errors gracefully with fallbacks
3. ✅ Clean up subscriptions on unmount
4. ✅ Debounce rapid updates
5. ✅ Memoize expensive computations
6. ✅ Use loading guards to prevent concurrent operations
7. ✅ Detect actual context changes before updating
8. ✅ Provide user-friendly error messages
9. ✅ Log errors for debugging
10. ✅ Test with mock SDK client
