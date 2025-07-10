# Drive Connector

A React web application that allows users to connect to Google Drive or Microsoft OneDrive/SharePoint, browse files, and download them through a unified interface.

## Features

- **Multi-provider Authentication**: Support for Google Drive and Microsoft OneDrive/SharePoint
- **File Browser**: Navigate folders and view file metadata
- **File Downloads**: Download files directly from the cloud storage
- **Responsive UI**: Clean, modern interface built with Tailwind CSS

## Tech Stack

- React 18 + TypeScript
- Vite for development and building
- Google Drive API v3
- Microsoft Graph API
- MSAL (Microsoft Authentication Library)
- Tailwind CSS

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback

VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

### 3. Set Up OAuth Applications

**Google Drive:**
- Follow detailed setup in `GDrive-Documentation.md`
- Create OAuth client in Google Cloud Console
- Add redirect URI: `http://localhost:5173/auth/google/callback`

**Microsoft OneDrive:**
- Follow detailed setup in `OneDrive-Documentation.md`
- Register app in Azure Portal
- Add redirect URI: `http://localhost:5173/auth/microsoft/callback`

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:5173` and choose your cloud storage provider.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Documentation

- **[Google Drive Setup](./GDrive-Documentation.md)** - Complete Google Cloud Console setup
- **[OneDrive Setup](./OneDrive-Documentation.md)** - Complete Azure Portal setup
- **[Project Tasks](./Tasks.md)** - Development roadmap and features
- **[Development Guide](./CLAUDE.md)** - Project structure and coding guidelines

## How It Works

1. **Authentication**: Users choose Google or Microsoft and complete OAuth flow
2. **File Browsing**: App fetches and displays files/folders from the connected drive
3. **Navigation**: Click folders to navigate, use breadcrumb to go back
4. **Downloads**: Click download icon to save files locally

## Security

- Uses OAuth 2.0 for secure authentication
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Read-only permissions by default
- No server component required

## Production Deployment

1. Update redirect URIs in OAuth applications to production domains
2. Set environment variables for production
3. For Google: Submit app for verification if serving public users
4. For Microsoft: Consider single vs multi-tenant configuration
