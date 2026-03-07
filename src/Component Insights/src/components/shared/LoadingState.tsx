"use client";

import { Box, Spinner, Text, VStack } from "@chakra-ui/react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading component data..." }: LoadingStateProps) {
  return (
    <VStack spacing={4} py={12} role="status" aria-label="Loading">
      <Spinner size="lg" color="blue.500" thickness="3px" />
      <Text fontSize="sm" color="gray.500">
        {message}
      </Text>
    </VStack>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
      <Text color="red.600" fontSize="sm">
        ❌ {message}
      </Text>
    </Box>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <VStack spacing={2} py={8}>
      <Text fontSize="2xl">📭</Text>
      <Text fontSize="sm" color="gray.500" textAlign="center">
        {message}
      </Text>
    </VStack>
  );
}
