# Drive Connector

A React web application that allows users to connect to Google Drive or Microsoft OneDrive/SharePoint, browse files, and download them through a unified interface.

## Features

- **Multi-provider Authentication**: Support for Google Drive and Microsoft OneDrive/SharePoint
- **Advanced File Browser**: Navigate folders, view metadata, and access shared drives
- **Enhanced Navigation**: 
  - My Drive, Shared with me, Recent files, and Shared drives (Google)
  - Expandable sidebar with drive sections
  - Breadcrumb navigation with clickable path
- **Universal Selection System**: 
  - Checkbox selection for both files and folders
  - "Select All" functionality for bulk operations
  - Mixed selection of files and folders
- **Hierarchical Zip Downloads**: 
  - Download selected files and folders as organized zip files
  - Maintains original folder structure in zip archives
  - Recursive folder downloading with progress tracking
  - Works with any combination of files and folders
- **Real-time Progress**: Visual progress bars for zip creation and downloads
- **Responsive UI**: Clean, modern interface built with Tailwind CSS

## Tech Stack

- React 18 + TypeScript
- Vite for development and building
- Google Drive API v3
- Microsoft Graph API
- MSAL (Microsoft Authentication Library)
- JSZip for client-side zip file creation
- Tailwind CSS for styling
- Lucide React for icons

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

### Authentication & Access
1. **Provider Selection**: Choose between Google Drive or Microsoft OneDrive/SharePoint
2. **OAuth Flow**: Secure authentication with read-only permissions
3. **Drive Access**: Automatically access personal files, shared files, and organizational drives

### Navigation & Browsing
4. **Sidebar Navigation**: Switch between different file views:
   - **My Drive**: Personal files and folders
   - **Shared with me**: Files others have shared with you
   - **Recent**: Recently accessed files across all drives
   - **Shared drives**: Organizational shared drives (Google Workspace)
5. **File Explorer**: Click folders to navigate, use breadcrumb for quick navigation
6. **File Metadata**: View file sizes, modification dates, and file types

### Selection & Downloads
7. **Universal Selection**: Check boxes next to any files or folders
8. **Bulk Operations**: Select multiple items across different types
9. **Hierarchical Downloads**: 
   - Selected items download as a single zip file
   - Original folder structure preserved in zip
   - Recursive downloading of entire folder trees
   - Real-time progress tracking for large downloads

### Example Zip Structure
```
your-download.zip/
├── Document.pdf                 (selected file)
├── Photos/                      (selected folder)
│   ├── vacation.jpg
│   └── family/
│       └── reunion.png
└── Reports/                     (selected folder)
    ├── Q1-report.docx
    └── data/
        └── analytics.xlsx
```

## Security

- Uses OAuth 2.0 for secure authentication
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Read-only permissions by default
- No server component required

## Key Features in Detail

### Universal Selection System
- **Checkbox Interface**: Every file and folder has a checkbox for selection
- **Mixed Selection**: Select any combination of files and folders simultaneously  
- **Select All**: One-click selection of all visible items
- **Clear Selection**: Easy deselection of all items
- **Auto-clear**: Selections automatically clear when navigating between folders

### Advanced Download Capabilities  
- **Hierarchical Zip Creation**: Preserves original folder structure in downloads
- **Recursive Processing**: Automatically includes all files within selected folders
- **Progress Tracking**: Real-time progress bars showing download status
- **Error Handling**: Continues downloading even if individual files fail
- **Large File Support**: Handles large folders and file collections efficiently

### Enhanced Navigation
- **Multi-Drive Support**: Access personal drives, shared drives, and organizational storage
- **Smart Breadcrumbs**: Click any part of the path to quickly navigate back
- **Section-based Views**: Dedicated views for recent files, shared content, etc.
- **Provider-Specific Features**: Google Workspace shared drives, OneDrive for Business

## Production Deployment

1. Update redirect URIs in OAuth applications to production domains
2. Set environment variables for production
3. For Google: Submit app for verification if serving public users
4. For Microsoft: Consider single vs multi-tenant configuration
5. Consider implementing server-side token refresh for better security
