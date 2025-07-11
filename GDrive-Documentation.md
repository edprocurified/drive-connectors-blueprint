# Google Drive Integration Documentation

## Prerequisites
- Google account
- Access to Google Cloud Console

## Complete Step-by-Step Google Cloud Setup

### 1. Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### 2. Create a New Project

1. Click on the project dropdown at the top (next to "Google Cloud")
2. Click "New Project"
3. Enter project name: "Drive Connector" (or your preferred name)
4. Leave organization as is (or select if you have one)
5. Click "Create"
6. Wait for the project to be created (you'll see a notification)

### 3. Enable Google Drive API

1. Make sure your new project is selected in the dropdown
2. In the left sidebar, navigate to "APIs & Services" > "Library"
3. In the search bar, type "Google Drive API"
4. Click on "Google Drive API" from the results
5. Click the blue "Enable" button
6. Wait for the API to be enabled

### 4. Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen:

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (this allows any Google account to use your app)
3. Click "Create"

**Fill in the App Information:**
- App name: "Drive Connector"
- User support email: Select your email from the dropdown
- App logo: Skip (optional)

**App domain (skip all these for development):**
- Application home page: Leave blank
- Application privacy policy link: Leave blank
- Application terms of service link: Leave blank

**Developer contact information:**
- Email addresses: Enter your email

Click "Save and Continue"

**Scopes page:**
1. Click "ADD OR REMOVE SCOPES"
2. In the popup, search for or scroll to find:
   - ✅ `https://www.googleapis.com/auth/drive.readonly` 
     - Look for "See and download all your Google Drive files"
     - **Note: This single scope includes access to shared drives**
3. Check the box
4. Click "UPDATE" at the bottom of the popup
5. Click "SAVE AND CONTINUE"

**Test users page:**
1. Click "+ ADD USERS"
2. Enter your email address
3. Add any other email addresses that need to test the app
4. Click "ADD"
5. Click "SAVE AND CONTINUE"

**Summary page:**
- Review your settings
- Click "BACK TO DASHBOARD"

### 5. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "OAuth client ID"

**Configure the OAuth client:**
- Application type: Select "Web application"
- Name: "Drive Connector Web Client"

**Authorized JavaScript origins:**
Click "ADD URI" and add:
- `http://localhost:5173`

**Authorized redirect URIs:**
Click "ADD URI" and add:
- `http://localhost:5173/auth/google/callback`

4. Click "CREATE"

### 6. Copy Your Credentials

A popup will appear with your credentials:
- **Client ID**: Copy this (looks like `xxxxx-xxxxx.apps.googleusercontent.com`)
- **Client secret**: You don't need this for frontend-only apps

Click "OK" to close the popup.

### 7. Set Up Your Application

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=paste_your_client_id_here
```

Replace `paste_your_client_id_here` with the Client ID you copied from Google Cloud Console.

### 8. Run Your Application

```bash
npm run dev
```

Visit `http://localhost:5173` and test the Google Drive integration!

## Google Drive API Scopes

### Required Scopes
- `https://www.googleapis.com/auth/drive.readonly` - Full read access to all files including shared drives

### Optional Scopes (for future features)
- `https://www.googleapis.com/auth/drive.file` - Access to files created by the app
- `https://www.googleapis.com/auth/drive` - Full access (use cautiously)

## API Usage Limits

### Default Quotas
- 1 billion requests per day
- 100 requests per 100 seconds per user
- 1000 requests per 100 seconds

### Best Practices
- Implement exponential backoff for rate limiting
- Cache file metadata when possible
- Use fields parameter to limit response data
- Batch requests when fetching multiple files

## Key API Endpoints

### Authentication
```
https://accounts.google.com/o/oauth2/v2/auth
https://oauth2.googleapis.com/token
```

### Drive API v3
```
GET https://www.googleapis.com/drive/v3/files
GET https://www.googleapis.com/drive/v3/files/{fileId}
GET https://www.googleapis.com/drive/v3/files/{fileId}?alt=media
```

## Common File Queries

### List files in a folder
```
q: "'folderId' in parents and trashed = false"
```

### List only folders
```
q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false"
```

### Get root folder contents
```
q: "'root' in parents and trashed = false"
```

## File Types & MIME Types

### Google Workspace Files (need export)
- Google Docs: `application/vnd.google-apps.document`
- Google Sheets: `application/vnd.google-apps.spreadsheet`
- Google Slides: `application/vnd.google-apps.presentation`

### Regular Files
- Can be downloaded directly using `alt=media` parameter

## Error Handling

### Common Errors
- `401 Unauthorized` - Token expired or invalid
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - File doesn't exist or no access
- `429 Too Many Requests` - Rate limit exceeded

### Token Refresh
- Access tokens expire after 1 hour
- Use refresh token to get new access token
- Store refresh token securely

## Security Considerations

1. Never expose client secret in frontend code
2. Use state parameter in OAuth flow to prevent CSRF
3. Validate all tokens server-side if possible
4. Implement proper token storage (consider HttpOnly cookies for production)
5. Use HTTPS in production
6. Implement proper CORS configuration

## Common Issues & Troubleshooting

### "Access blocked" error
- Make sure you added your email as a test user in the OAuth consent screen
- Check that the project is in "Testing" mode, not "Production"

### "Redirect URI mismatch" error
- Verify the redirect URI `http://localhost:5173/auth/google/callback` matches exactly what you configured in Google Cloud Console
- Common mistake: trailing slashes or different ports

### "Invalid client" error
- Double-check your Client ID is copied correctly
- Make sure you're using the Web application OAuth client, not another type

### Can't find Drive API scopes
- Ensure Google Drive API is enabled first
- Refresh the OAuth consent screen page
- Try manually entering the scope URLs

## Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Tokens are stored and retrieved correctly
- [ ] File listing works for root directory
- [ ] Folder navigation works
- [ ] File metadata is displayed correctly
- [ ] File download works for regular files
- [ ] Error messages are user-friendly
- [ ] Multiple users can log in and see their own files

## Production Deployment Checklist

### 1. Update OAuth Credentials
- Add your production domain to Authorized JavaScript origins
- Add production callback URL to Authorized redirect URIs (e.g., `https://yourdomain.com/auth/google/callback`)
- Update environment variables with production values

### 2. Submit for Google Verification
- Required if you want non-test users to access the app
- Go to OAuth consent screen → "Publish App"
- Google will review your app (can take days/weeks)
- May require:
  - Privacy policy
  - Terms of service
  - Domain verification
  - Security assessment

### 3. Security Best Practices
- Use HTTPS in production (required by Google)
- Implement proper token storage (consider httpOnly cookies)
- Add CSRF protection
- Implement token refresh mechanism
- Monitor API quotas and implement rate limiting