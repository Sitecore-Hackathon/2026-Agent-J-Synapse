"use client";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import React from "react";

let baseTheme = {};
try {
  const blokModule = require("@sitecore/blok-theme");
  baseTheme = blokModule.theme || blokModule.default || blokModule;
} catch {
  // Use default Chakra theme if blok-theme is not available
}

// Extend with our custom tokens
const customTheme = extendTheme(
  typeof baseTheme === "object" && baseTheme !== null ? baseTheme : {},
  {
    colors: {
      inspector: {
        valid: "#38A169",
        warning: "#DD6B20",
        error: "#E53E3E",
        info: "#3182CE",
        muted: "#A0AEC0",
        surface: "#F7FAFC",
        surfaceHover: "#EDF2F7",
      },
    },
    styles: {
      global: {
        body: {
          bg: "white",
          color: "gray.800",
        },
      },
    },
    components: {
      Accordion: {
        baseStyle: {
          container: { borderColor: "gray.200" },
          button: { _hover: { bg: "inspector.surfaceHover" } },
        },
      },
    },
  }
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // FIX #3: suppressHydrationWarning prevents the mismatch error
    // Chakra injects data-theme and class attributes client-side
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ChakraProvider theme={customTheme}>{children}</ChakraProvider>
      </body>
    </html>
  );
}
