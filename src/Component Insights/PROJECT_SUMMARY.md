# Component Insights - Project Summary

## Overview

The Component Insights is a Sitecore Marketplace extension that provides comprehensive visibility into page components, their properties, usage, and relationships within XM Cloud Pages. It helps content editors and developers understand component structure, datasource dependencies, and impact analysis.

## Key Features

### 1. Component Listing & Details
- **Real-time Component Discovery**: Automatically detects and lists all components on the current page
- **Component Properties**: Displays detailed information including:
  - Component name and ID
  - Placeholder location
  - Datasource information
  - Variants
  - Parameters and styles
  - Field values

### 2. Usage Analysis
- **Component Usage Tracking**: Shows how many pages use a specific component/rendering
- **Datasource Usage Tracking**: Identifies shared datasources and their usage across pages
- **Impact Warning**: Alerts when datasources are shared across multiple pages
- **Usage Details Modal**: Displays comprehensive list of pages using components/datasources with:
  - Site and page names
  - Language information
  - Workflow status
  - Field references (Section/Field details)
  - Direct links to Content Editor

### 3. Page Properties
- **Item Information**: Displays page metadata including:
  - Item path
  - Item ID
  - Created by / Last modified by
  - Date last modified
  - Lock status (when applicable)

### 4. Search & Filter
- **Text Search**: Search components by name, placeholder, or datasource
- **Filter Options**:
  - All components
  - Broken components (missing datasource or fields)
  - Missing datasource
  - Shared datasource

## Technical Architecture

### Extension Points
- **Pages Context Panel Extension**: Main extension point for component inspection

### Core Services

#### Layout Service (`src/services/layoutService.ts`)
- Fetches rendered layout data via GraphQL
- Parses layout JSON into structured component information
- Handles dynamic placeholder resolution
- Groups components by placeholder

#### Usage Service (`src/services/usageService.ts`)
- Fetches component and datasource usage data
- Integrates with Sitecore Horizon API for reference queries
- Implements OAuth token management
- Provides batch usage fetching for performance

### API Routes

#### `/api/auth/proxy-token`
- Proxies OAuth token requests to avoid CORS issues
- Handles client credentials flow for Sitecore Cloud authentication

#### `/api/horizon/query`
- Proxies Horizon GraphQL queries
- Handles usage/reference queries with proper authentication

#### `/api/authoring/query`
- Proxies Authoring GraphQL queries
- Used for fetching item lock information

### Key Hooks

#### `usePageLayout`
- Manages page context and layout data
- Handles real-time updates via SDK subscriptions
- Coordinates component enrichment with usage data

#### `useComponentUsages`
- Manages usage data fetching and caching
- Provides batch enrichment capabilities
- Handles per-component usage lookups

#### `useMarketplaceClient`
- Initializes and manages Marketplace SDK client
- Handles SDK lifecycle and error states

## Data Flow

1. **Context Retrieval**: SDK provides `pages.context` and `application.context`
2. **Layout Fetching**: GraphQL query fetches rendered layout data
3. **Component Parsing**: Layout JSON is parsed into structured component information
4. **Usage Enrichment**: Components are enriched with usage counts and page references
5. **Real-time Updates**: Subscriptions to `pages.content.layoutUpdated` and `pages.content.fieldsUpdated` trigger data refresh

## Technologies

- **Framework**: Next.js 15.5.2
- **UI Library**: Chakra UI 2.10.9
- **SDK**: @sitecore-marketplace-sdk/client (latest)
- **Language**: TypeScript 5
- **Styling**: Emotion (CSS-in-JS)

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes for proxying requests
│   │   ├── auth/
│   │   ├── authoring/
│   │   └── horizon/
│   ├── pages-contextpanel-extension/  # Main extension point
│   └── fullscreen-extension/          # Fullscreen view
├── components/
│   ├── context-panel/          # Context panel components
│   ├── fullscreen/             # Fullscreen components
│   └── shared/                 # Shared components
├── hooks/                      # React hooks
├── services/                   # Business logic services
├── types/                      # TypeScript type definitions
└── utils/                      # Utility functions
```

## Key Achievements

1. ✅ Real-time component detection and listing
2. ✅ Component and datasource usage tracking
3. ✅ Impact analysis and warnings
4. ✅ Integration with Sitecore Horizon API
5. ✅ OAuth authentication handling
6. ✅ Page properties display with lock status
7. ✅ Search and filter capabilities
8. ✅ Responsive UI with Chakra UI
9. ✅ Type-safe implementation with TypeScript

## Future Enhancements

- Export component data to CSV/JSON
- Component dependency graph visualization
- Bulk operations on components
- Component template suggestions
- Performance metrics and recommendations
