// src/hooks/useMarketplaceClient.ts
"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Public return shape for the hook.
 */
export interface MarketplaceClientState {
  /** The fully‑initialised Marketplace client (or null while loading). */
  client: any | null;
  /** True when the client has completed `init()` and is ready to be used. */
  isReady: boolean;
  /** Human‑readable error message if the SDK could not be loaded or init failed. */
  error: string | null;
}

let clientInstance: any | undefined = undefined;

/**
 * Hook that lazily loads the Marketplace SDK, creates a client instance,
 * runs `init()`, and returns the ready‑to‑use client.
 */
export function useMarketplaceClient(): MarketplaceClientState {
  const [client, setClient] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return; 
    initRef.current = true;

    async function bootstrap() {
      try {
        // -------------------------------------------------
        //  Dynamically import the SDK – avoids SSR issues.
        // -------------------------------------------------
        const [{ ClientSDK }, { XMC }] = await Promise.all([
          import("@sitecore-marketplace-sdk/client"),
          import("@sitecore-marketplace-sdk/xmc"),
        ]);

        // -------------------------------------------------
        // Initialize the client using ClientSDK.init()
        // -------------------------------------------------
        // Reuse existing client instance if available
        if (!clientInstance) {
          const config = {
            target: window.parent,
            modules: [XMC],
          };

          clientInstance = await ClientSDK.init(config);
        }

        setClient(clientInstance);
        setIsReady(true);
      } catch (err: any) {
        console.error("[useMarketplaceClient] SDK bootstrap failed:", err);
        setError(err?.message ?? "Failed to load Marketplace SDK");
      }
    }

    bootstrap();
  }, []);

  return { client, isReady, error };
}
