"use client";

import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Kbd,
  Tooltip,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import type { FilterType } from "@/types";
import { useEffect, useRef } from "react";

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  totalCount: number;
  filteredCount: number;
}

const filterLabels: Record<FilterType, string> = {
  all: "All Components",
  "missing-datasource": "❌ Empty Datasource",
  "shared-datasource": "🔗 Shared Datasource",
};

export function SearchFilterBar({
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  totalCount,
  filteredCount,
}: SearchFilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        onSearchChange("");
        inputRef.current?.blur();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchChange]);

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={10}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={3}
      py={2}
    >
      <HStack spacing={2}>
        <InputGroup size="sm" flex={1}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" boxSize={3} />
          </InputLeftElement>
          <Input
            ref={inputRef}
            placeholder="Filter components..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            borderRadius="md"
            fontSize="sm"
            aria-label="Search components"
          />
          <InputRightElement width="auto" pr={1}>
            {searchTerm ? (
              <IconButton
                aria-label="Clear search"
                icon={<CloseIcon boxSize={2} />}
                size="xs"
                variant="ghost"
                onClick={() => onSearchChange("")}
              />
            ) : (
              <Tooltip label='Press "/" to search' hasArrow>
                <Kbd fontSize="xs" bg="gray.100">
                  /
                </Kbd>
              </Tooltip>
            )}
          </InputRightElement>
        </InputGroup>

        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            variant="outline"
            rightIcon={<ChevronDownIcon />}
            fontSize="xs"
            minW="120px"
          >
            {activeFilter !== "all" && (
              <Badge colorScheme="blue" mr={1} fontSize="xx-small">
                •
              </Badge>
            )}
            Filter
          </MenuButton>
          <MenuList fontSize="sm" minW="200px">
            {(Object.keys(filterLabels) as FilterType[]).map((filter) => (
              <MenuItem
                key={filter}
                onClick={() => onFilterChange(filter)}
                bg={activeFilter === filter ? "blue.50" : undefined}
                fontWeight={activeFilter === filter ? "bold" : "normal"}
              >
                {filterLabels[filter]}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </HStack>

      {(searchTerm || activeFilter !== "all") && (
        <Box mt={1}>
          <Badge colorScheme="gray" fontSize="xx-small">
            Showing {filteredCount} of {totalCount}
          </Badge>
        </Box>
      )}
    </Box>
  );
}
