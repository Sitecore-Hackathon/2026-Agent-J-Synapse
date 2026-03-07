# SDK Integration Guide

## Overview

This document describes how the Component Inspector integrates with the Sitecore Marketplace SDK to access page context, layout data, and real-time updates.

## SDK Initialization

### Client Setup

The SDK client is initialized in `src/hooks/useMarketplaceClient.ts`:

```typescript
import { ClientSDK } from "@sitecore-marketplace-sdk/client";

const client = ClientSDK.init({
  // SDK automatically detects the environment
  // No explicit configuration needed
});
```

### Usage in Components

```typescript
import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";

function MyComponent() {
  const { client, isInitialized, error } = useMarketplaceClient();
  
  if (!isInitialized) return <Loading />;
  if (error) return <Error message={error} />;
  
  // Use client for SDK operations
}
```

## Context Queries

### Pages Context

Retrieves current page information:

```typescript
client.query("pages.context", {
  subscribe: true,
  onSuccess: (ctx: PagesContext) => {
    // ctx.pageInfo contains:
    // - id: page item ID
    // - name: page name
    // - path: page path
    // - language: page language
    // - createdBy, updatedBy, updatedDate
    // - locking: lock information
  }
});
```

### Application Context

Retrieves application-level context including preview context ID:

```typescript
client.query("application.context")
  .then((res: ApplicationContext) => {
    // Extract sitecoreContextId from:
    // res.resourceAccess.find(r => r.resourceId === "xmcloud")?.context?.preview
  });
```

### Host State

Retrieves environment information:

```typescript
client.query("host.state", {
  subscribe: true,
  onSuccess: (res: HostState) => {
    // res.xmCloudTenantInfo.url contains environment URL
  }
});
```

## GraphQL Queries

### Layout Data

Fetches rendered layout via SDK GraphQL:

```typescript
const result = await client.mutate("xmc.preview.graphql", {
  params: {
    query: { sitecoreContextId },
    body: {
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
        siteName: "YourSite",
        routePath: "/",
        language: "en"
      }
    }
  }
});
```

## Real-time Subscriptions

### Layout Updates

Subscribe to layout changes:

```typescript
const unsubscribe = client.subscribe("pages.content.layoutUpdated", () => {
  // Refresh component data
  refreshData();
});
```

### Field Updates

Subscribe to field changes:

```typescript
const unsubscribe = client.subscribe("pages.content.fieldsUpdated", () => {
  // Refresh component data
  refreshData();
});
```

### Cleanup

Always unsubscribe when component unmounts:

```typescript
useEffect(() => {
  const unsubscribe = client.subscribe("pages.content.layoutUpdated", handleUpdate);
  
  return () => {
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  };
}, [client]);
```

## Type Definitions

### PagesContext

```typescript
interface PagesContext {
  pageInfo: {
    id: string;
    name: string;
    displayName: string;
    path: string;
    language: string;
    createdBy?: string;
    updatedBy?: string;
    updatedDate?: string;
    locking?: {
      isLocked: boolean;
      lockedBy?: string;
    };
  };
  siteInfo: {
    name: string;
    language: string;
  };
}
```

### ApplicationContext

```typescript
interface ApplicationContext {
  resourceAccess: Array<{
    resourceId: string;
    context?: {
      preview?: string; // sitecoreContextId
    };
  }>;
}
```

### HostState

```typescript
interface HostState {
  xmCloudTenantInfo?: {
    url: string; // Environment URL
  };
}
```

## Best Practices

### 1. Error Handling

Always handle SDK errors gracefully:

```typescript
try {
  const result = await client.query("pages.context");
} catch (error) {
  console.error("SDK query failed:", error);
  // Fallback behavior
}
```

### 2. Subscription Management

- Always check if `client.subscribe` is available
- Store unsubscribe functions
- Clean up subscriptions in useEffect cleanup

### 3. Context Dependency

- Wait for `isInitialized` before making SDK calls
- Handle cases where context might be undefined
- Provide loading states during initialization

### 4. Performance

- Use debouncing for rapid updates
- Cache context data when appropriate
- Batch operations when possible

## Common Patterns

### Pattern 1: Context-Aware Component

```typescript
function ContextAwareComponent() {
  const { client } = useMarketplaceClient();
  const [context, setContext] = useState<PagesContext | null>(null);
  
  useEffect(() => {
    if (!client) return;
    
    client.query("pages.context", {
      subscribe: true,
      onSuccess: setContext
    });
  }, [client]);
  
  if (!context) return <Loading />;
  
  return <div>{context.pageInfo.name}</div>;
}
```

### Pattern 2: Real-time Updates

```typescript
function RealtimeComponent() {
  const { client } = useMarketplaceClient();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!client) return;
    
    const unsubscribe = client.subscribe("pages.content.layoutUpdated", () => {
      // Debounce updates
      setTimeout(() => refreshData(), 500);
    });
    
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [client]);
  
  // Component render
}
```

## Troubleshooting

### Issue: SDK not initialized

**Solution**: Check that the app is running within XM Cloud Pages environment and that the SDK is properly configured.

### Issue: Context queries return undefined

**Solution**: Ensure `sitecoreContextId` is available from `application.context` before making GraphQL queries.

### Issue: Subscriptions not firing

**Solution**: Verify that `client.subscribe` is available and that the subscription is set up correctly with proper cleanup.

### Issue: CORS errors

**Solution**: Use API route proxies (`/api/*`) for external API calls instead of direct browser requests.
