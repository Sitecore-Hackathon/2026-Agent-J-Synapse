"use client";

import {
  Box,
  Text,
  Accordion,
  HStack,
  Badge,
} from "@chakra-ui/react";
import type { PlaceholderGroup as PlaceholderGroupType, PageContextInfo } from "@/types";
import { ComponentAccordion } from "./ComponentAccordion";
import { humanizePlaceholder } from "@/utils/helpers";

interface PlaceholderGroupProps {
  group: PlaceholderGroupType;
  pageContext?: PageContextInfo | null;
}

export function PlaceholderGroupSection({ group, pageContext }: PlaceholderGroupProps) {
  const phIcon = getPlaceholderIcon(group.placeholderKey);

  return (
    <Box mb={4}>
      <HStack px={3} py={1} bg="gray.50" borderRadius="md" mb={2}>
        <Text fontSize="xs">{phIcon}</Text>
        <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase">
          {humanizePlaceholder(group.placeholderKey)}
        </Text>
        <Badge colorScheme="gray" fontSize="xx-small">
          {group.components.length}
        </Badge>
      </HStack>

      <Accordion allowMultiple>
        {group.components.map((comp) => (
          <ComponentAccordion key={comp.instanceId} component={comp} pageContext={pageContext} />
        ))}
      </Accordion>
    </Box>
  );
}

function getPlaceholderIcon(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("header") || k.includes("nav")) return "🔝";
  if (k.includes("main") || k.includes("content")) return "📄";
  if (k.includes("sidebar")) return "📌";
  if (k.includes("footer")) return "🔻";
  return "📦";
}
