# OneDrive/SharePoint Integration Documentation

## Overview
Microsoft uses the Microsoft Graph API for accessing OneDrive (personal) and SharePoint/OneDrive for Business files. The same API and authentication flow works for both services.

## Prerequisites
- Microsoft account (personal) OR Microsoft 365 account (work/school)
- Access to Azure Portal (free tier available)

## Complete Step-by-Step Azure Setup

### 1. Access Azure Portal

1. Go to [Azure Portal](https://portal.azure.com/)
2. Sign in with your Microsoft account
   - Personal: Use your @outlook.com, @hotmail.com, etc.
   - Work/School: Use your organizational account

**Note:** If you don't have an Azure account, you'll need to create one (free tier is sufficient)

### 2. Register Your Application

1. In the Azure Portal, search for "App registrations" in the top search bar
2. Click on "App registrations" service
3. Click "+ New registration"

**Fill in the registration form:**
- Name: "Drive Connector"
- Supported account types: Choose based on your needs:
  - **"Accounts in any organizational directory and personal Microsoft accounts"** (Recommended - works for all users)
  - "Accounts in this organizational directory only" (Single tenant - only your org)
  - "Personal Microsoft accounts only" (Only personal accounts)
- Redirect URI:
  - Platform: Select "Single-page application (SPA)"
  - URI: `http://localhost:5173/auth/microsoft/callback`

4. Click "Register"

### 3. Configure Authentication

After registration, you'll be on your app's overview page.

1. Note your **Application (client) ID** - you'll need this later
2. In the left menu, click "Authentication"
3. Under "Single-page application", verify your redirect URI is listed
4. Add additional redirect URIs if needed:
   - Click "Add URI"
   - Add: `http://localhost:3000/auth/microsoft/callback` (backup)
5. Under "Implicit grant and hybrid flows":
   - ✅ Check "Access tokens"
   - ✅ Check "ID tokens"
6. Click "Save" at the top

### 4. Configure API Permissions

1. In the left menu, click "API permissions"
2. You should see "User.Read" already added
3. Click "+ Add a permission"
4. Choose "Microsoft Graph"
5. Choose "Delegated permissions"
6. Search and add these permissions:
   - **Files.Read** - Read user files
   - **Files.Read.All** - Read all files user can access
   - **Sites.Read.All** - Read SharePoint sites (for SharePoint access)
   - **User.Read** - Sign in and read user profile (already added)

7. Click "Add permissions"

**Important for Work/School accounts:**
- If you see "Grant admin consent" button, you may need an admin to approve these permissions
- For personal Microsoft accounts, no admin consent is needed

### 5. Get Your Credentials

From the Overview page:
- **Application (client) ID**: Copy this value (looks like: `12345678-1234-1234-1234-123456789012`)
- **Directory (tenant) ID**: Note this if using single tenant

### 6. Set Up Your Application

Update your `.env` file:

```env
# Keep your existing Google credentials
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_REDIRECT_URI=http://localhost:5173/auth/callback

# Add Microsoft credentials
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

## Microsoft Graph API Details

### Authentication Endpoint
```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize
```

For single tenant (organization only):
```
https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
```

### Token Endpoint
```
https://login.microsoftonline.com/common/oauth2/v2.0/token
```

### Required Scopes
- `User.Read` - Basic profile information
- `Files.Read` - Read user's files
- `Files.Read.All` - Read all files user can access
- `Sites.Read.All` - Read SharePoint sites

### API Endpoints

**OneDrive Personal:**
```
GET https://graph.microsoft.com/v1.0/me/drive/root/children
GET https://graph.microsoft.com/v1.0/me/drive/items/{item-id}/children
GET https://graph.microsoft.com/v1.0/me/drive/items/{item-id}/content
```

**SharePoint/OneDrive for Business:**
```
GET https://graph.microsoft.com/v1.0/sites/root
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drive
GET https://graph.microsoft.com/v1.0/drives/{drive-id}/root/children
```

## Key Differences from Google Drive

### 1. Authentication Flow
- Microsoft uses MSAL (Microsoft Authentication Library)
- Supports both implicit flow and PKCE flow
- Different token format and validation

### 2. API Structure
- Microsoft Graph is a unified API for all Microsoft services
- Different endpoint structure
- Different file metadata format

### 3. File Types
- OneDrive files have different MIME types
- SharePoint has additional concepts (sites, libraries)
- Different sharing mechanisms

### 4. Permissions
- More granular permission scopes
- Admin consent may be required for organizational accounts
- Different permission models for personal vs work accounts

## Common Issues & Troubleshooting

### "AADSTS50011: Reply URL mismatch"
- Ensure redirect URI in your app matches exactly what's in Azure
- Check for trailing slashes
- Verify you selected "SPA" platform type

### "Need admin approval"
- For work/school accounts, an admin must consent to permissions
- Personal accounts don't have this restriction
- Contact your IT administrator

### "Invalid client"
- Verify Application ID is copied correctly
- Check you're using the right tenant (common vs specific)

### Can't access SharePoint files
- Ensure Sites.Read.All permission is granted
- Admin consent may be required
- User must have SharePoint access in their organization

## Testing Different Account Types

### Personal Microsoft Account
- Use @outlook.com, @hotmail.com, @live.com accounts
- Access personal OneDrive files
- No admin consent needed

### Work/School Account
- Use organizational email
- Access OneDrive for Business and SharePoint
- May need IT admin approval
- Check with your organization's policies

## Production Deployment

### 1. Update Azure App Registration
- Add production redirect URIs
- Update authentication settings
- Consider multi-tenant vs single-tenant

### 2. Security Considerations
- Use PKCE flow instead of implicit flow for better security
- Implement proper token storage
- Handle token refresh
- Monitor API usage and quotas

### 3. Compliance
- Review Microsoft's terms of service
- Ensure GDPR compliance if handling EU data
- Follow your organization's security policies
- Implement proper data handling procedures

## API Quotas and Limits

### Standard Limits
- 120 requests per minute per user
- 40,000 requests per hour per app
- File size limits vary by account type

### Best Practices
- Implement caching for file metadata
- Use delta queries for changes
- Batch requests when possible
- Handle throttling gracefully

## Next Steps

1. Complete the Azure app registration
2. Update your application code to support Microsoft authentication
3. Implement Microsoft Graph API calls
4. Test with both personal and work accounts
5. Handle the differences in file structures between OneDrive and SharePoint