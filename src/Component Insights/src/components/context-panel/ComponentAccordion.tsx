"use client";

import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  HStack,
  Text,
  Badge,
} from "@chakra-ui/react";
import type { ComponentInfo, PageContextInfo } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ComponentDetails } from "./ComponentDetails";
import { humanizeComponentName } from "@/utils/helpers";

interface ComponentAccordionProps {
  component: ComponentInfo;
  pageContext?: PageContextInfo | null;
}

export function ComponentAccordion({ component: comp, pageContext }: ComponentAccordionProps) {
  // Choose icon based on component type
  const icon = getComponentIcon(comp.componentName);

  return (
    <AccordionItem border="1px solid" borderColor="gray.200" borderRadius="md" mb={2}>
      <h3>
        <AccordionButton
          py={2}
          px={3}
          _hover={{ bg: "gray.50" }}
          borderRadius="md"
          aria-label={`Expand ${comp.componentName} details`}
        >
          <HStack flex={1} spacing={2} overflow="hidden">
            <Text fontSize="sm">{icon}</Text>
            <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
              {humanizeComponentName(comp.componentName)}
            </Text>
            {comp.componentUsageCount > 1 && (
              <Badge colorScheme="blue" fontSize="xx-small" borderRadius="full">
                {comp.componentUsageCount} usages across instance
              </Badge>
            )}
            
          </HStack>
          <AccordionIcon />
        </AccordionButton>
      </h3>
      <AccordionPanel pb={3} pt={0}>
        <ComponentDetails component={comp} pageContext={pageContext} />
      </AccordionPanel>
    </AccordionItem>
  );
}

function getComponentIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("hero") || n.includes("banner")) return "🖼️";
  if (n.includes("nav") || n.includes("header")) return "🧭";
  if (n.includes("footer")) return "🦶";
  if (n.includes("card") || n.includes("promo")) return "🃏";
  if (n.includes("image") || n.includes("media")) return "📷";
  if (n.includes("text") || n.includes("rich") || n.includes("content")) return "📝";
  if (n.includes("form") || n.includes("contact")) return "📋";
  if (n.includes("tab")) return "📑";
  if (n.includes("accordion") || n.includes("collapse")) return "🪗";
  if (n.includes("link") || n.includes("cta")) return "🔗";
  if (n.includes("search")) return "🔍";
  if (n.includes("column") || n.includes("container") || n.includes("grid")) return "📐";
  return "🧩";
}
