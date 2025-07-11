import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { GoogleDriveService } from '../services/googleDrive'
import { SharedDrive, DriveSection, NavigationState } from '../types'
import { 
  Folder, 
  Share, 
  Clock, 
  Users,
  ChevronDown,
  ChevronRight,
  HardDrive
} from 'lucide-react'

interface NavigationProps {
  currentNav: NavigationState
  onNavigate: (nav: NavigationState) => void
}

export default function Navigation({ currentNav, onNavigate }: NavigationProps) {
  const { tokens, provider } = useAuth()
  const [sharedDrives, setSharedDrives] = useState<SharedDrive[]>([])
  const [sharedDrivesExpanded, setSharedDrivesExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadSharedDrives = useCallback(async () => {
    if (!tokens?.access_token) return
    
    setLoading(true)
    try {
      const driveService = new GoogleDriveService(tokens.access_token)
      const drives = await driveService.listSharedDrives()
      setSharedDrives(drives)
    } catch (error) {
      console.error('Error loading shared drives:', error)
    } finally {
      setLoading(false)
    }
  }, [tokens])

  useEffect(() => {
    if (provider === 'google' && tokens?.access_token) {
      loadSharedDrives()
    }
  }, [provider, tokens, loadSharedDrives])

  const handleSectionClick = (section: DriveSection, folderId: string = 'root', folderName: string = '') => {
    const sectionNames = {
      'my-drive': 'My Drive',
      'shared-with-me': 'Shared with me',
      'shared-drives': 'Shared drives',
      'recent': 'Recent'
    }

    onNavigate({
      section,
      folderId,
      folderName: folderName || sectionNames[section],
      driveId: undefined,
      driveName: undefined
    })
  }

  const handleSharedDriveClick = (drive: SharedDrive) => {
    onNavigate({
      section: 'shared-drives',
      folderId: 'root',  // Keep as 'root' - the driveId parameter handles the context
      folderName: drive.name,
      driveId: drive.id,
      driveName: drive.name
    })
  }

  const isActive = (section: DriveSection, driveId?: string) => {
    if (driveId) {
      return currentNav.section === 'shared-drives' && currentNav.driveId === driveId
    }
    return currentNav.section === section
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {provider === 'google' ? 'Google Drive' : 'OneDrive'}
        </h2>
        
        <nav className="space-y-1">
          {/* My Drive */}
          <button
            onClick={() => handleSectionClick('my-drive')}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              isActive('my-drive')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <HardDrive className="h-4 w-4 mr-3" />
            My Drive
          </button>

          {/* Shared with me */}
          <button
            onClick={() => handleSectionClick('shared-with-me')}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              isActive('shared-with-me')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Share className="h-4 w-4 mr-3" />
            Shared with me
          </button>

          {/* Recent */}
          <button
            onClick={() => handleSectionClick('recent')}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
              isActive('recent')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Clock className="h-4 w-4 mr-3" />
            Recent
          </button>

          {/* Shared Drives (Google only) */}
          {provider === 'google' && (
            <>
              <button
                onClick={() => setSharedDrivesExpanded(!sharedDrivesExpanded)}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {sharedDrivesExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-3" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-3" />
                )}
                <Users className="h-4 w-4 mr-3" />
                Shared drives
                {loading && (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                  </div>
                )}
              </button>

              {sharedDrivesExpanded && (
                <div className="ml-6 space-y-1">
                  {sharedDrives.map((drive) => (
                    <button
                      key={drive.id}
                      onClick={() => handleSharedDriveClick(drive)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        isActive('shared-drives', drive.id)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Folder className="h-4 w-4 mr-3" />
                      <span className="truncate">{drive.name}</span>
                    </button>
                  ))}
                  {sharedDrives.length === 0 && !loading && (
                    <div className="px-3 py-2 text-xs text-gray-500">
                      No shared drives
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </nav>
      </div>
    </div>
  )
}