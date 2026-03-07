"use client";

import { Badge, Tooltip } from "@chakra-ui/react";

interface StatusBadgeProps {
  isDatasourceMissing: boolean;
  isLocalDatasource: boolean;
  datasourceUsageCount: number;
}

export function StatusBadge({
  isDatasourceMissing,
  isLocalDatasource,
  datasourceUsageCount,
}: StatusBadgeProps) {
  if (isDatasourceMissing) {
    return (
      <Tooltip label="Datasource is missing or not set" hasArrow>
        <Badge
          colorScheme="red"
          variant="solid"
          fontSize="xs"
          borderRadius="full"
          px={2}
          aria-label="Missing datasource"
        >
          ⚠ Missing
        </Badge>
      </Tooltip>
    );
  }

  if (!isLocalDatasource && datasourceUsageCount > 1) {
    return (
      <Tooltip
        label={`Shared datasource — used on ${datasourceUsageCount} pages. Editing may affect other pages!`}
        hasArrow
      >
        <Badge
          colorScheme="orange"
          variant="solid"
          fontSize="xs"
          borderRadius="full"
          px={2}
          aria-label={`Shared on ${datasourceUsageCount} pages`}
        >
          🔗 Datasource shared on ({datasourceUsageCount}) pages
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip label="Local datasource — safe to edit" hasArrow>
      <Badge
        colorScheme="green"
        variant="subtle"
        fontSize="xs"
        borderRadius="full"
        px={2}
        aria-label="Valid local datasource"
      >
        ✓ Valid
      </Badge>
    </Tooltip>
  );
}
