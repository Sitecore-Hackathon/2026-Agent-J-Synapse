# Setup Checklist

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Access to Sitecore XM Cloud environment
- [ ] Sitecore Marketplace account
- [ ] OAuth credentials (client_id and client_secret) for API access

## Initial Setup

### 1. Clone/Download Project

```bash
# If cloning from repository
git clone [repository-url]
cd 2026-Agent-J-Synapse/src/Component Insights

# Or extract from template
```

### 2. Install Dependencies

```bash
npm install
```

**Expected Output**: All packages from `package.json` installed successfully

### 3. Environment Variables

Create `.env.local` file (if needed for OAuth):

```env
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_OAUTH_CLIENT_SECRET=your_client_secret
```

### 4. Verify Project Structure

Ensure the following directories exist:

- [ ] `src/app/pages-contextpanel-extension/`
- [ ] `src/app/fullscreen-extension/`
- [ ] `src/components/context-panel/`
- [ ] `src/hooks/`
- [ ] `src/services/`
- [ ] `src/app/api/`

### 5. Build Project

```bash
npm run build
```

**Expected Output**: Successful build with no errors

## Development Setup

### 1. Start Development Server

```bash
npm run dev
```

**Expected Output**: Server running on `http://localhost:3000`

### 2. Verify SDK Integration

- [ ] Check browser console for SDK initialization logs
- [ ] Verify no SDK errors on startup
- [ ] Confirm `ClientSDK.init()` succeeds

### 3. Test Extension Points

#### Pages Context Panel Extension

- [ ] Navigate to XM Cloud Pages
- [ ] Open a page in edit mode
- [ ] Verify context panel extension loads
- [ ] Check that page information displays correctly
- [ ] Verify components are listed

## Configuration Checklist

### Marketplace Configuration

- [ ] `sitecore-marketplace.json` exists and is valid
- [ ] Extension points are properly configured
- [ ] Routes match extension point configurations

### API Routes

- [ ] `/api/auth/proxy-token` route exists
- [ ] `/api/horizon/query` route exists
- [ ] `/api/authoring/query` route exists

### TypeScript Configuration

- [ ] `tsconfig.json` is properly configured
- [ ] No TypeScript errors in project
- [ ] Type definitions are correct

## Functional Testing

### Component Listing

- [ ] Components are detected on page load
- [ ] Component names display correctly
- [ ] Placeholder paths are correct
- [ ] Dynamic placeholders are resolved (e.g., `container-{*}` → `container-2`)

### Component Details

- [ ] Component name displays
- [ ] Datasource information shows correctly
- [ ] Variants display properly
- [ ] Parameters JSON is visible
- [ ] Fields are shown

### Usage Tracking

- [ ] Component usage count displays
- [ ] Datasource usage count displays
- [ ] Usage modal opens correctly
- [ ] Usage list shows page information
- [ ] Links to Content Editor work

### Page Properties

- [ ] Item path displays
- [ ] Item ID displays
- [ ] Created by / Last modified by show
- [ ] Date formatting is correct
- [ ] Lock information displays when applicable

### Search & Filter

- [ ] Text search works
- [ ] Filter options work correctly
- [ ] Results update in real-time

### Real-time Updates

- [ ] Components update when layout changes
- [ ] Components update when fields change
- [ ] No infinite refresh loops
- [ ] Updates are debounced properly

## API Integration Testing

### OAuth Token

- [ ] Token is fetched successfully
- [ ] Token is cached appropriately
- [ ] Token refresh works when expired

### Horizon API

- [ ] Usage queries execute successfully
- [ ] Reference data is retrieved
- [ ] Pagination works (if applicable)

### Authoring API

- [ ] Lock information is fetched
- [ ] Lock status displays correctly

## Performance Checklist

- [ ] Initial load time is acceptable (< 3 seconds)
- [ ] Component list renders smoothly
- [ ] No memory leaks (check with DevTools)
- [ ] Subscriptions are cleaned up properly
- [ ] Debouncing prevents excessive API calls

## Error Handling

- [ ] SDK initialization errors are handled
- [ ] GraphQL errors are caught and displayed
- [ ] API errors show user-friendly messages
- [ ] Network errors are handled gracefully
- [ ] Missing data shows appropriate fallbacks

## Browser Compatibility

- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Edge (latest)
- [ ] Works in Safari (latest)

## Security Checklist

- [ ] OAuth credentials are not exposed in client code
- [ ] API routes validate input
- [ ] CORS is handled properly
- [ ] No sensitive data in console logs (production)

## Documentation

- [ ] README.md is up to date
- [ ] Code comments are clear
- [ ] Type definitions are documented
- [ ] API routes are documented

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] Environment variables are configured
- [ ] OAuth credentials are set
- [ ] API routes are functional

### Deployment Steps

1. [ ] Build production bundle: `npm run build`
2. [ ] Test production build locally: `npm start`
3. [ ] Deploy to hosting platform
4. [ ] Configure environment variables on hosting platform
5. [ ] Verify API routes work in production
6. [ ] Test extension points in XM Cloud

### Post-Deployment

- [ ] Verify extension loads in XM Cloud Pages
- [ ] Test all functionality in production
- [ ] Monitor error logs
- [ ] Check performance metrics

## Troubleshooting Common Issues

### Issue: SDK not initializing

**Check**:
- [ ] Running in XM Cloud Pages environment
- [ ] SDK packages are installed
- [ ] No console errors

**Solution**: Verify environment and SDK installation

### Issue: Components not loading

**Check**:
- [ ] `sitecoreContextId` is available
- [ ] GraphQL query succeeds
- [ ] Layout data is returned

**Solution**: Check context retrieval and GraphQL queries

### Issue: Usage counts showing 0

**Check**:
- [ ] OAuth token is valid
- [ ] Horizon API is accessible
- [ ] GraphQL queries are correct

**Solution**: Verify API integration and credentials

### Issue: Dynamic placeholders not resolving

**Check**:
- [ ] Parent component params are passed correctly
- [ ] `DynamicPlaceholderId` is in params
- [ ] Placeholder resolution logic is correct

**Solution**: Review placeholder resolution implementation

## Maintenance Checklist

### Regular Updates

- [ ] Update SDK packages regularly
- [ ] Update Next.js and dependencies
- [ ] Review and update TypeScript types
- [ ] Check for security vulnerabilities: `npm audit`

### Code Quality

- [ ] Run linter: `npm run lint`
- [ ] Fix all linting errors
- [ ] Review code for improvements
- [ ] Update documentation as needed

## Support Resources

- Sitecore Marketplace Documentation: https://doc.sitecore.com/mp/
- SDK Documentation: Check SDK package documentation
- Issue Tracker: [Your repository issues]
- Community Forums: Sitecore Community

## Notes

- Keep OAuth credentials secure
- Monitor API rate limits
- Test in staging before production
- Keep dependencies updated for security
