"use client";

import {
  Box,
  Text,
  HStack,
  VStack,
  Code,
  IconButton,
  Tooltip,
  useDisclosure,
  Link,
  Wrap,
  WrapItem,
  Tag,
} from "@chakra-ui/react";
import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import type { ComponentInfo, PageContextInfo } from "@/types";
import { ImpactWarningModal } from "./ImpactWarningModal";
import { extractVariantNames, buildContentEditorUrl, extractDatasourceId } from "@/utils/helpers";

interface ComponentDetailsProps {
  component: ComponentInfo;
  pageContext?: PageContextInfo | null;
}

export function ComponentDetails({ component: comp, pageContext }: ComponentDetailsProps) {
  const dsModal = useDisclosure();
  const compModal = useDisclosure();

  const variants = extractVariantNames(comp.variant);

  const handleCopyParams = () => {
    navigator.clipboard.writeText(JSON.stringify(comp.parameters, null, 2));
  };

  return (
    <Box px={3} py={2} fontSize="xs">
      <VStack align="stretch" spacing={2}>
        {/* Name with Component Usage */}
        <Box>
          <HStack justify="space-between">
            <Text color="gray.500" fontWeight="semibold" minW="80px">
              Name:
            </Text>
            <HStack flex={1} spacing={1} flexWrap="wrap">
              <Text fontSize="xs" color="gray.800">
                {comp.componentName}
              </Text>
              {comp.componentUsageCount > 0 && (
                <Link
                  onClick={compModal.onOpen}
                  color="blue.500"
                  fontWeight="bold"
                  fontSize="xs"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                >
                  ({comp.componentUsageCount} usages → View All)
                </Link>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Datasource */}
        <Box>
          <HStack justify="space-between">
            <Text color="gray.500" fontWeight="semibold" minW="80px">
              Datasource:
            </Text>
            <HStack flex={1} spacing={1} flexWrap="wrap">
              {(() => {
                const datasource = comp.datasourcePath || comp.datasourceId || "";
                // const datasourceId = extractDatasourceId(datasource);
                const displayText = datasource || "—";
                
                if (!datasource) {
                  return <Text fontSize="xs" color="gray.400">—</Text>;
                }
                
                  const language = pageContext?.language || "en";
                  const contentEditorUrl = buildContentEditorUrl(datasource, language, 1, pageContext);
                  return (
                    <Link
                      href={contentEditorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      color="blue.500"
                      fontSize="xs"
                      _hover={{ textDecoration: "underline" }}
                    >
                      <Code
                        fontSize="xs"
                        px={1}
                        borderRadius="sm"
                        colorScheme={comp.isDatasourceMissing ? "red" : "gray"}
                        whiteSpace="normal"
                        wordBreak="break-all"
                      >
                        📁 {displayText}
                      </Code>
                      <ExternalLinkIcon boxSize={3} />
                    </Link>
                  );
          
                
              })()}
              {comp.datasourceUsageCount > 1 && (
                <Link
                  onClick={dsModal.onOpen}
                  color="orange.500"
                  fontWeight="bold"
                  fontSize="xs"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                >
                  ({comp.datasourceUsageCount} usages → View All)
                </Link>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Placeholder */}
        <DetailRow label="Placeholder" value={comp.placeholderKey} />

        {/* Variants */}
        <Box>
          <HStack>
            <Text color="gray.500" fontWeight="semibold" minW="80px">
              Variants:
            </Text>
            <Wrap spacing={1}>
              {variants.map((v, i) => (
                <WrapItem key={i}>
                  <Tag size="sm" colorScheme="purple" variant="subtle">
                    {v}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </HStack>
        </Box>

        {/* Parameters */}
        {Object.keys(comp.parameters).length > 0 && (
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text color="gray.500" fontWeight="semibold">
                Parameters:
              </Text>
              <HStack spacing={1}>
                <Tooltip label="Copy parameters JSON" hasArrow>
                  <IconButton
                    aria-label="Copy parameters"
                    icon={<CopyIcon boxSize={3} />}
                    size="xs"
                    variant="ghost"
                    onClick={handleCopyParams}
                  />
                </Tooltip>
              </HStack>
            </HStack>
            <Code
              display="block"
              whiteSpace="pre-wrap"
              fontSize="xx-small"
              p={2}
              borderRadius="md"
              bg="gray.50"
              maxH="80px"
              overflow="auto"
            >
              {JSON.stringify(comp.parameters, null, 2)}
            </Code>
          </Box>
        )}

        {/* Styles */}
        {comp.styles && <DetailRow label="Styles" value={comp.styles} />}

        {/* ⚠️ Impact Warning */}
        {!comp.isLocalDatasource && comp.datasourceUsageCount > 1 && (
          <Box
            bg="orange.50"
            border="1px solid"
            borderColor="orange.200"
            borderRadius="md"
            p={2}
            mt={1}
          >
            <HStack>
              <Text fontSize="xs">⚠️</Text>
              <Text fontSize="xs" color="orange.700" fontWeight="medium">
                <strong>Impact Warning:</strong> This datasource is used on{" "}
                {comp.datasourceUsageCount} other pages.{" "}
                <Link
                  onClick={dsModal.onOpen}
                  color="orange.600"
                  fontWeight="bold"
                  textDecoration="underline"
                  cursor="pointer"
                >
                  View affected pages
                </Link>
              </Text>
            </HStack>
          </Box>
        )}
      </VStack>

      {/* Modals */}
      <ImpactWarningModal
        isOpen={dsModal.isOpen}
        onClose={dsModal.onClose}
        title={comp.datasourcePath || comp.datasourceId || "Datasource"}
        usageType="datasource"
        pages={comp.datasourceUsagePages}
        pageContext={pageContext}
      />
      <ImpactWarningModal
        isOpen={compModal.isOpen}
        onClose={compModal.onClose}
        title={comp.componentName}
        usageType="component"
        pages={comp.componentUsagePages}
        pageContext={pageContext}
      />
    </Box>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack>
      <Text color="gray.500" fontWeight="semibold" minW="80px">
        {label}:
      </Text>
      <Text color="gray.800" noOfLines={1}>
        {value || "—"}
      </Text>
    </HStack>
  );
}
