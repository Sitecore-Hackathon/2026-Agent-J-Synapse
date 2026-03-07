"use client";

import { Box, VStack, Alert, AlertIcon } from "@chakra-ui/react";
// import { useMarketplaceClient } from "@/hooks/useMarketplaceClient";
import { useMarketplaceClient } from "@/utils/hooks/useMarketplaceClient";
import { usePageLayout } from "@/hooks/usePageLayout";
import { PanelHeader } from "./PanelHeader";
import { SearchFilterBar } from "./SearchFilterBar";
import { PlaceholderGroupSection } from "./PlaceholderGroup";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/shared/LoadingState";

export function ContextPanelApp() {
  const { client, isInitialized, error: sdkError } = useMarketplaceClient();
  const {
    pageContext,
    pagesContext,
    components,
    isLoading,
    error,
    refresh,
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    filteredGroups,
  } = usePageLayout(client);

  // ── SDK not ready ──
  if (sdkError) {
    return (
      <Box p={4}>
        <ErrorState message={`SDK Error: ${sdkError}`} />
        <Alert status="info" mt={3} fontSize="xs" borderRadius="md">
          <AlertIcon />
          Make sure this app is running inside XM Cloud Pages as a Marketplace
          extension.
        </Alert>
      </Box>
    );
  }

  if (!isInitialized) {
    return <LoadingState message="Initializing Component Inspector..." />;
  }

  const totalComponentCount = components.length;
  const filteredComponentCount = filteredGroups.reduce(
    (sum, g) => sum + g.components.length,
    0
  );

  return (
    <Box
      h="100%"
      display="flex"
      flexDirection="column"
      bg="white"
      overflow="hidden"
      role="region"
      aria-label="Component Inspector Panel"
    >
      {/* Header */}
      <PanelHeader
        pageTitle={pageContext?.itemName || "No page selected"}
        pageInfo={pagesContext?.pageInfo}
        environmentUrl={pageContext?.environmentUrl}
        onRefresh={refresh}
        isLoading={isLoading}
      />

      {/* Search & Filter — Sticky top */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        totalCount={totalComponentCount}
        filteredCount={filteredComponentCount}
      />

      {/* Scrollable content area */}
      <Box flex={1} overflow="auto" px={2} py={2}>
        {isLoading && <LoadingState />}

        {error && !isLoading && <ErrorState message={error} />}

        {!isLoading && !error && filteredGroups.length === 0 && (
          <EmptyState
            message={
              searchTerm || activeFilter !== "all"
                ? "No components match your filter criteria."
                : "No components found on this page."
            }
          />
        )}

        {!isLoading && !error && filteredGroups.length > 0 && (
          <VStack align="stretch" spacing={1}>
            {filteredGroups.map((group) => (
              <PlaceholderGroupSection
                key={group.placeholderKey}
                group={group}
                pageContext={pageContext}
              />
            ))}
          </VStack>
        )}
      </Box>

      {/* Bottom CTA */}
      {/* <Box
        px={3}
        py={2}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="gray.50"
      >
        <Button
          size="sm"
          colorScheme="blue"
          width="100%"
          onClick={handleOpenFullscreen}
          leftIcon={<Text>⛶</Text>}
        >
          Open Fullscreen Inspector
        </Button>
      </Box> */}
    </Box>
  );
}
