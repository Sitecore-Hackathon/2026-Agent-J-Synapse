# Hackathon Submission Entry form

## Team name
⟹ [Your Team Name Here]

## Category
⟹ [Your Selected Category]

## Description
⟹ The Component Inspector is a powerful Sitecore Marketplace extension that provides comprehensive visibility into page components, their properties, usage, and relationships within XM Cloud Pages. It helps content editors and developers understand component structure, datasource dependencies, and impact analysis in real-time.

### Module Purpose
The Component Inspector serves as a comprehensive tool for content editors and developers working with Sitecore XM Cloud Pages. It provides:

- **Real-time Component Discovery**: Automatically detects and lists all components on the current page
- **Component Usage Tracking**: Shows how many pages use a specific component/rendering
- **Datasource Usage Tracking**: Identifies shared datasources and their usage across pages
- **Impact Analysis**: Alerts when datasources are shared across multiple pages with detailed usage information
- **Page Properties Display**: Shows comprehensive page metadata including lock status
- **Dynamic Placeholder Resolution**: Intelligently resolves dynamic placeholders (e.g., `container-{*}` → `container-2`)
- **Search & Filter**: Powerful search and filtering capabilities for components

### What problem was solved

**Problem**: Content editors and developers working with Sitecore XM Cloud Pages often struggle with:
- Understanding which components are used on a page
- Identifying shared datasources and their impact across multiple pages
- Tracking component usage across the site
- Resolving dynamic placeholder paths
- Understanding page metadata and lock status

**How does this module solve it**:

1. **Component Visibility**: The extension automatically parses the page layout and displays all components in an organized, searchable interface grouped by placeholder.

2. **Usage Analysis**: Integrates with Sitecore's Horizon API to fetch real-time usage data for both components and datasources, showing exactly where they are used across the site.

3. **Impact Warnings**: When a datasource is shared across multiple pages, the extension displays a warning with detailed information about all pages using that datasource, including workflow status and field references.

4. **Dynamic Placeholder Resolution**: Automatically resolves dynamic placeholder keys using parent component parameters, making it easy to understand component hierarchy.

5. **Direct Content Editor Links**: Provides clickable links to open items directly in the Sitecore Content Editor, improving workflow efficiency.

6. **Real-time Updates**: Subscribes to page context changes and layout updates, ensuring the component list stays synchronized with the current page state.

For more detailed information, see [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md).

## Video link
⟹ [Replace this Video link](#video-link)

## Pre-requisites and Dependencies

The Component Inspector requires:

- **Sitecore XM Cloud** environment with Pages application
- **Node.js 18+** and npm/yarn package manager
- **Sitecore Marketplace SDK** packages (automatically installed via npm):
  - `@sitecore-marketplace-sdk/client` (latest)
  - `@sitecore-marketplace-sdk/xmc` (latest)
- **OAuth Credentials** for Sitecore Cloud API access:
  - Client ID
  - Client Secret
  - These are used for Horizon API and Authoring API authentication

### Sitecore Configuration
- The extension must be installed and configured in the Sitecore Marketplace
- Extension point: `pages-contextpanel-extension` (main extension)
- Optional: `fullscreen-extension` for full-screen component analysis

## Installation instructions

### Step 1: Clone or Download the Project
```bash
git clone [repository-url]
cd marketplace-starter
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required dependencies including:
- Next.js 15.5.2
- React 19.1.0
- Chakra UI 2.10.9
- Sitecore Marketplace SDK packages

### Step 3: Configure Environment Variables
Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Update `.env.local` with your OAuth credentials:
```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_OAUTH_CLIENT_SECRET=your_client_secret_here
OAUTH_TOKEN_URL=https://auth.sitecorecloud.io/oauth/token
OAUTH_AUDIENCE=https://api.sitecorecloud.io
```

### Step 4: Build the Project
```bash
npm run build
```

### Step 5: Deploy to Hosting Platform
Deploy the built application to your hosting platform (e.g., Vercel, Netlify, or any Node.js hosting service).

**Important**: Ensure that API routes (`/api/auth/proxy-token`, `/api/horizon/query`, `/api/authoring/query`) are deployed as serverless functions if using static export.

### Step 6: Configure in Sitecore Marketplace
1. Navigate to Sitecore Marketplace in your XM Cloud environment
2. Install the Component Inspector extension
3. Configure the extension point: `pages-contextpanel-extension`
4. Set the extension URL to your deployed application URL

### Configuration

#### OAuth Credentials
The extension requires OAuth credentials to access Sitecore's Horizon API and Authoring API. These credentials must be:
- Obtained from your Sitecore Cloud environment
- Stored securely in environment variables (never commit to version control)
- Configured in `.env.local` for local development
- Configured in your hosting platform's environment variables for production

#### API Routes
The extension includes three API routes that proxy requests to avoid CORS issues:
- `/api/auth/proxy-token` - Proxies OAuth token requests
- `/api/horizon/query` - Proxies Horizon GraphQL queries
- `/api/authoring/query` - Proxies Authoring GraphQL queries

These routes must be deployed as serverless functions in production environments.

For detailed setup instructions, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md).

## Usage instructions

### Accessing the Component Inspector

1. **Open XM Cloud Pages**: Navigate to your Sitecore XM Cloud Pages application
2. **Open a Page**: Open any page in edit mode
3. **View Context Panel**: The Component Inspector appears in the context panel on the right side of the Pages editor

### Main Features

#### 1. Component Listing
The main view displays all components on the current page, organized by placeholder:
- **Component Name**: The rendering name (e.g., "Promo", "Image", "Navigation")
- **Placeholder Location**: Shows where the component is placed (e.g., "headless-main", "headless-footer")
- **Usage Count**: Displays how many pages use this component (clickable to view details)
- **Datasource**: Shows the datasource path or ID with usage count

#### 2. Component Details
Click on any component to expand and view detailed information:
- **Component Properties**: Instance ID, component ID, placeholder key
- **Datasource Information**: Full datasource path with clickable link to Content Editor
- **Variants**: Displays all variant names (e.g., "Default", "Hero", "Card")
- **Parameters**: JSON view of all component parameters
- **Fields**: All field values associated with the component

#### 3. Usage Analysis
- **Component Usage**: Click the usage count next to a component name to see all pages using that component
- **Datasource Usage**: Click the usage count next to a datasource to see all pages using that datasource
- **Usage Modal**: Displays:
  - Site and page names
  - Language information
  - Workflow status
  - Field references (Section/Field details)
  - Direct links to Content Editor

#### 4. Page Properties
The panel header displays comprehensive page information:
- **Item Path**: Full Sitecore content path
- **Item ID**: Unique identifier
- **Created By / Last Modified By**: User information
- **Date Last Modified**: Formatted timestamp
- **Lock Status**: Shows who has the page locked (if applicable)

#### 5. Search & Filter
Use the search bar and filter options to quickly find components:
- **Text Search**: Search by component name, placeholder, or datasource
- **Filter Options**:
  - **All**: Show all components
  - **Broken**: Components with missing datasource or fields
  - **Missing Datasource**: Components without a datasource
  - **Shared Datasource**: Components using shared datasources

#### 6. Real-time Updates
The component list automatically updates when:
- You navigate to a different page
- Components are added or removed from the layout
- Field values are updated
- The page context changes

### Keyboard Shortcuts
Currently, the extension does not have custom keyboard shortcuts. All interactions are mouse/touch-based.

### Tips & Best Practices

1. **Usage Analysis**: Before deleting or modifying a shared datasource, check its usage to understand the impact across your site.

2. **Component Search**: Use the search feature to quickly find specific components on pages with many components.

3. **Content Editor Links**: Click on datasource links or usage page links to quickly navigate to items in the Content Editor.

4. **Filter Usage**: Use the "Shared Datasource" filter to identify components that might have broader impact when modified.

5. **Dynamic Placeholders**: The extension automatically resolves dynamic placeholders, making it easier to understand component hierarchy.

### Troubleshooting

**Issue**: Components not loading
- **Solution**: Ensure the page is published and you have proper permissions. Check browser console for errors.

**Issue**: Usage counts showing 0
- **Solution**: Verify OAuth credentials are correctly configured in environment variables.

**Issue**: Links not working
- **Solution**: Ensure `environmentUrl` is correctly retrieved from the SDK's `host.state` query.

For detailed troubleshooting, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md#troubleshooting-common-issues).

### Technical Documentation

For developers who want to understand or extend the Component Inspector:

- **Architecture Overview**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- **SDK Integration**: [SDK_INTEGRATION.md](./SDK_INTEGRATION.md)
- **Complete SDK Integration Guide**: [SDK_INTEGRATION_COMPLETE.md](./SDK_INTEGRATION_COMPLETE.md)
- **Setup & Configuration**: [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)

## Comments

### Key Technical Achievements

1. **Real-time Component Detection**: Successfully integrated with Sitecore Marketplace SDK to fetch and parse page layouts in real-time.

2. **Usage Tracking Integration**: Implemented integration with Sitecore's Horizon API to fetch component and datasource usage data, including proper OAuth authentication.

3. **Dynamic Placeholder Resolution**: Developed intelligent algorithm to resolve dynamic placeholder keys using parent component parameters.

4. **Performance Optimization**: Implemented debouncing, memoization, and batch fetching to ensure smooth performance even with many components.

5. **Error Handling**: Comprehensive error handling with user-friendly messages and graceful fallbacks.

### Future Enhancements

Potential improvements for future versions:
- Export component data to CSV/JSON
- Component dependency graph visualization
- Bulk operations on components
- Component template suggestions
- Performance metrics and recommendations
- Keyboard shortcuts for power users
- Component comparison across pages

### Known Limitations

- The extension requires OAuth credentials to be configured for usage tracking
- API routes must be deployed as serverless functions for production static exports
- Some features require the page to be published (layout data fetching)

### Support

For issues, questions, or contributions, please refer to the repository's issue tracker or contact the development team.

---

**Note**: Screenshots and video will be added to this README in a future update to provide visual documentation of the Component Inspector in action.
