"use client";

import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Tooltip,
  Divider,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";

interface PageInfo {
  path?: string;
  id?: string;
  language?: string;
  createdBy?: string;
  updatedBy?: string;
  updatedDate?: string;
}

interface LockInfo {
  isLocked: boolean;
  lockedBy?: string;
}

interface PanelHeaderProps {
  pageTitle: string;
  pageInfo?: PageInfo;
  environmentUrl?: string;
  onRefresh: () => void;
  isLoading: boolean;
}

/**
 * Format ISO date string to readable format: "Mar 7, 2026, 4:36:10 PM"
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return "—";
  
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  } catch {
    return dateString;
  }
}

async function getAccessToken(): Promise<string> {
  const urlencoded = new URLSearchParams();
  urlencoded.append("audience", process.env.OAUTH_AUDIENCE || "https://api.sitecorecloud.io");
  urlencoded.append("grant_type", "client_credentials");
  urlencoded.append("client_id", process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "");
  urlencoded.append("client_secret", process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET || "");

  const response = await fetch("/api/auth/proxy-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: urlencoded,
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchLockInfo(
  environmentUrl: string,
  itemPath: string,
  language: string
): Promise<LockInfo | null> {
  try {
    const accessToken = await getAccessToken();
    const authoringUrl = `${environmentUrl}/sitecore/api/authoring/graphql/v1`;

    const queryPayload = {
      query: `
        query GetItem($path: String!, $language: String!) {
          item(where: { path: $path, language: $language }) {
            lock {
              lockedBy
              isLocked
            }
          }
        }
      `,
      variables: {
        path: itemPath,
        language: language,
      },
    };

    // Call authoring API via proxy
    const response = await fetch("/api/authoring/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authoringUrl,
        accessToken,
        queryPayload,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      return null;
    }

    const lock = data.data?.item?.lock;
    if (lock) {
      return {
        isLocked: lock.isLocked || false,
        lockedBy: lock.lockedBy || undefined,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function PanelHeader({
  pageTitle,
  pageInfo,
  environmentUrl,
  onRefresh,
  isLoading,
}: PanelHeaderProps) {
  const [lockInfo, setLockInfo] = useState<LockInfo | null>(null);
  const [isLoadingLock, setIsLoadingLock] = useState(false);

  // Fetch lock information when pageInfo or environmentUrl changes
  useEffect(() => {
    if (!pageInfo?.path || !pageInfo?.language || !environmentUrl) {
      setLockInfo(null);
      return;
    }

    setIsLoadingLock(true);
    fetchLockInfo(environmentUrl, pageInfo.path, pageInfo.language)
      .then(setLockInfo)
      .catch(() => {
        setLockInfo(null);
      })
      .finally(() => {
        setIsLoadingLock(false);
      });
  }, [pageInfo?.path, pageInfo?.language, environmentUrl]);

  return (
    <Box
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={3}
      py={2}
    >
      <VStack align="stretch" spacing={2}>
        {/* Title and Refresh Button */}
        <HStack justify="space-between">
          <HStack spacing={2} overflow="hidden" flex={1}>
            <Text fontSize="xs" color="gray.400">
              🔍
            </Text>
            <Text fontSize="sm" fontWeight="bold" noOfLines={1} color="gray.800">
              {pageTitle || "Component Inspector"}
            </Text>
          </HStack>

          <HStack spacing={1}>
            <Tooltip label="Refresh data" hasArrow>
              <IconButton
                aria-label="Refresh"
                icon={<RepeatIcon />}
                size="xs"
                variant="ghost"
                onClick={onRefresh}
                isLoading={isLoading}
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* Page Properties */}
        {pageInfo && (
          <>
            <Divider />
            <VStack align="stretch" spacing={1.5} fontSize="sm">
              {/* Item path */}
              <HStack spacing={2} align="flex-start">
                <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                  Item path:
                </Text>
                <Text color="gray.700" wordBreak="break-all" flex={1}>
                  {pageInfo.path || "—"}
                </Text>
              </HStack>

              {/* Item Id */}
              <HStack spacing={2} align="flex-start">
                <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                  Item Id:
                </Text>
                <Text color="gray.700" wordBreak="break-all" flex={1}>
                  {pageInfo.id || "—"}
                </Text>
              </HStack>

              {/* Created by */}
              <HStack spacing={2} align="flex-start">
                <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                  Created by:
                </Text>
                <Text color="gray.700" flex={1}>
                  {pageInfo.createdBy || "—"}
                </Text>
              </HStack>

              {/* Last modified by */}
              <HStack spacing={2} align="flex-start">
                <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                  Last modified by:
                </Text>
                <Text color="gray.700" flex={1}>
                  {pageInfo.updatedBy || "—"}
                </Text>
              </HStack>

              {/* Date last modified */}
              <HStack spacing={2} align="flex-start">
                <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                  Date last modified:
                </Text>
                <Text color="gray.700" flex={1}>
                  {formatDate(pageInfo.updatedDate)}
                </Text>
              </HStack>

              {/* Item locked status - fetched from Authoring API */}
              {!isLoadingLock && lockInfo?.isLocked && (
                <HStack spacing={2} align="flex-start">
                  <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                    Item locked:
                  </Text>
                  <Text color="gray.700" flex={1}>
                  {lockInfo.isLocked ? "Yes" : "No"}
                  </Text>
                </HStack>
              )}

              {/* Item lock By (conditional) - fetched from Authoring API */}
              {!isLoadingLock && lockInfo?.isLocked && lockInfo?.lockedBy && (
                <HStack spacing={2} align="flex-start">
                  <Text color="gray.500" fontWeight="bold" w="150px" flexShrink={0}>
                    Item lock By:
                  </Text>
                  <Text color="gray.700" flex={1}>
                    {lockInfo.lockedBy}
                  </Text>
                </HStack>
              )}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
