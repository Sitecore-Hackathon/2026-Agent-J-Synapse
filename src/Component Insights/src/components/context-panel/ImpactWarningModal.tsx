"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
  Button,
  Icon,
  Link,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import type { UsagePage, PageContextInfo } from "@/types";
import { buildContentEditorUrl } from "@/utils/helpers";

interface ImpactWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  usageType: "component" | "datasource";
  pages: UsagePage[];
  pageContext?: PageContextInfo | null;
}

export function ImpactWarningModal({
  isOpen,
  onClose,
  title,
  pages,
  pageContext,
}: ImpactWarningModalProps) {
  // Build Content Editor URL using item ID (same as datasource links)
  const buildPageUrl = (page: UsagePage): string | null => {
    if (!page.itemId) return null;
    
    // Use the same buildContentEditorUrl function we use for datasources
    return buildContentEditorUrl(
      page.itemId,
      page.language || pageContext?.language || "en",
      1, // version
      pageContext
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">
            Content item usage
          </Text>
          <Text fontSize="sm" color="gray.600" fontWeight="normal" mt={1}>
            Check all pages that use the {title} item
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={4}>
          {pages.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No usages found.
            </Text>
          ) : (
            <VStack align="stretch" spacing={0}>
              {pages.map((page, idx) => {
                const pageUrl = buildPageUrl(page);
                
                return (
                  <Box
                    key={`${page.itemId}-${idx}`}
                    borderBottom={idx < pages.length - 1 ? "1px solid" : "none"}
                    borderColor="gray.200"
                    py={3}
                    px={2}
                    _hover={{
                      bg: "gray.50",
                      borderRadius: "md",
                    }}
                    transition="background-color 0.2s"
                    cursor="default"
                  >
                    <HStack align="flex-start" spacing={3}>
                      <Icon boxSize={5} color="gray.400" mt={0.5} flexShrink={0}>
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </Icon>
                      <VStack align="flex-start" spacing={1.5} flex={1} minW={0}>
                        <HStack spacing={2} justify="space-between" align="center" w="100%">
                          <HStack spacing={2} flexWrap="wrap" align="center">
                            <Text fontSize="sm" fontWeight="medium" flexShrink={0}>
                              {page.siteName ? `${page.siteName} / ${page.itemName}` : page.itemName}
                            </Text>
                            <Badge colorScheme="gray" fontSize="xx-small" variant="subtle" px={1.5} py={0.5}>
                              {page.language || "English"}
                            </Badge>
                          </HStack>
                          <HStack spacing={1.5} align="center" flexShrink={0}>
                            {page.workflow ? (
                              <Badge colorScheme="gray" fontSize="xx-small" variant="subtle" px={1.5} py={0.5}>
                                {page.workflow}
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray" fontSize="xx-small" variant="subtle" px={1.5} py={0.5}>
                                No workflow
                              </Badge>
                            )}
                            {pageUrl && (
                              <Tooltip label={`Open ${page.itemName} in Content Editor`} hasArrow placement="top">
                                <IconButton
                                  as={Link}
                                  href={pageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Open ${page.itemName} in Content Editor`}
                                  icon={<ExternalLinkIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="gray"
                                  minW="20px"
                                  h="20px"
                                  _hover={{
                                    bg: "blue.50",
                                    color: "blue.600",
                                    transform: "scale(1.15)",
                                  }}
                                  transition="all 0.2s"
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </HStack>
                        {page.fieldSectionName && page.fieldDisplayName && (
                          <Text fontSize="xs" color="gray.600" pl={0}>
                            Section: {page.fieldSectionName} / Field: {page.fieldDisplayName}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="purple" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
