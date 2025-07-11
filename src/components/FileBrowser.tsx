import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GoogleDriveService } from '../services/googleDrive'
import { MicrosoftGraphService } from '../services/microsoftGraph'
import { DriveFile, NavigationState, GoogleDriveFile, MicrosoftDriveFile } from '../types'
import { Folder, File, LogOut, ChevronRight, Home, Archive, CheckSquare, Square } from 'lucide-react'
import Navigation from './Navigation'

export default function FileBrowser() {
  const { isAuthenticated, tokens, logout, provider } = useAuth()
  const navigate = useNavigate()
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [navigation, setNavigation] = useState<NavigationState>({
    section: 'my-drive',
    folderId: 'root',
    folderName: 'My Drive'
  })
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'My Drive' }])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null)

  console.log('FileBrowser render:', { isAuthenticated, tokens, provider, loading, error, filesCount: files.length, navigation })

  const loadFiles = useCallback(async (nav: NavigationState) => {
    console.log('loadFiles called:', { nav, provider, hasTokens: !!tokens })
    setLoading(true)
    setError(null)
    
    try {
      if (provider === 'google') {
        console.log('Using Google Drive service')
        const driveService = new GoogleDriveService(tokens!.access_token)
        let result
        
        switch (nav.section) {
          case 'my-drive':
          case 'shared-drives':
            result = await driveService.listFiles(nav.folderId, undefined, nav.driveId)
            break
          case 'shared-with-me':
            result = await driveService.listSharedWithMe()
            break
          case 'recent':
            result = await driveService.listRecent()
            break
          default:
            result = await driveService.listFiles(nav.folderId)
        }
        
        console.log('Google files loaded:', result.files.length)
        setFiles(result.files)
      } else if (provider === 'microsoft') {
        console.log('Using Microsoft Graph service')
        const graphService = new MicrosoftGraphService(tokens!.access_token)
        const { files } = await graphService.listFiles(nav.folderId)
        console.log('Microsoft files loaded:', files.length)
        setFiles(files)
      } else {
        console.log('No provider set, cannot load files')
      }
    } catch (err) {
      console.error('Error loading files:', err)
      setError('Failed to load files. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [provider, tokens])

  useEffect(() => {
    if (!isAuthenticated || !tokens) {
      navigate('/')
    }
  }, [isAuthenticated, tokens, navigate])

  useEffect(() => {
    if (tokens?.access_token) {
      loadFiles(navigation)
    }
  }, [navigation, tokens, loadFiles])

  const handleNavigation = (nav: NavigationState) => {
    setNavigation(nav)
    setSelectedFiles(new Set()) // Clear selections when navigating
    // Reset breadcrumb when switching sections
    if (nav.section === 'shared-with-me' || nav.section === 'recent') {
      setBreadcrumb([{ id: nav.folderId, name: nav.folderName }])
    } else if (nav.section === 'shared-drives' && nav.driveId) {
      setBreadcrumb([{ id: 'root', name: nav.driveName || nav.folderName }])
    } else {
      setBreadcrumb([{ id: 'root', name: 'My Drive' }])
    }
  }

  const navigateToFolder = (file: DriveFile) => {
    const newNav = {
      ...navigation,
      folderId: file.id,
      folderName: file.name
    }
    setNavigation(newNav)
    setBreadcrumb([...breadcrumb, { id: file.id, name: file.name }])
    setSelectedFiles(new Set()) // Clear selections when navigating
  }

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1)
    setBreadcrumb(newBreadcrumb)
    const targetFolder = newBreadcrumb[newBreadcrumb.length - 1]
    setNavigation({
      ...navigation,
      folderId: targetFolder.id,
      folderName: targetFolder.name
    })
    setSelectedFiles(new Set()) // Clear selections when navigating
  }


  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const selectAllFiles = () => {
    const allIds = files.map(f => f.id) // Select ALL items (files AND folders)
    setSelectedFiles(new Set(allIds))
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  const downloadSelectedFiles = async () => {
    if (selectedFiles.size === 0) return

    setDownloading(true)
    setDownloadProgress({ current: 0, total: selectedFiles.size })

    try {
      const selectedFileObjects = files.filter(f => selectedFiles.has(f.id))
      let blob: Blob

      if (provider === 'google') {
        const driveService = new GoogleDriveService(tokens!.access_token)
        blob = await driveService.downloadMultipleFiles(
          selectedFileObjects as GoogleDriveFile[],
          'selected-files.zip',
          (current, total) => setDownloadProgress({ current, total }),
          navigation.driveId
        )
      } else {
        const graphService = new MicrosoftGraphService(tokens!.access_token)
        blob = await graphService.downloadMultipleFiles(
          selectedFileObjects as MicrosoftDriveFile[],
          'selected-files.zip',
          (current, total) => setDownloadProgress({ current, total })
        )
      }

      // Download the zip file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'selected-files.zip'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Clear selection after download
      setSelectedFiles(new Set())
    } catch (error) {
      console.error('Failed to download selected files:', error)
      alert('Failed to download selected files')
    } finally {
      setDownloading(false)
      setDownloadProgress(null)
    }
  }


  const formatFileSize = (size?: string | number) => {
    if (!size) return '-'
    const bytes = typeof size === 'string' ? parseInt(size) : size
    const units = ['B', 'KB', 'MB', 'GB']
    let unitIndex = 0
    let fileSize = bytes
    
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024
      unitIndex++
    }
    
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isFolder = (file: DriveFile): boolean => {
    if ('mimeType' in file) {
      // Google Drive
      return file.mimeType === 'application/vnd.google-apps.folder'
    } else {
      // Microsoft OneDrive
      return !!file.folder
    }
  }

  const getModifiedTime = (file: DriveFile): string => {
    if ('modifiedTime' in file) {
      return file.modifiedTime
    } else {
      return file.lastModifiedDateTime
    }
  }

  const getFileSize = (file: DriveFile): string | number | undefined => {
    if ('size' in file && typeof file.size === 'string') {
      return file.size
    } else if ('size' in file && typeof file.size === 'number') {
      return file.size
    }
    return undefined
  }


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navigation Sidebar */}
      <Navigation currentNav={navigation} onNavigate={handleNavigation} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Drive Connector
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({provider === 'google' ? 'Google Drive' : 'OneDrive'})
                </span>
              </h1>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                {breadcrumb.map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />}
                    <button
                      onClick={() => navigateToBreadcrumb(index)}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {index === 0 ? <Home className="h-4 w-4" /> : crumb.name}
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Selection Controls */}
              <div className="flex items-center space-x-3">
                {selectedFiles.size > 0 && (
                  <>
                    <span className="text-sm text-gray-600">
                      {selectedFiles.size} selected
                    </span>
                    <button
                      onClick={downloadSelectedFiles}
                      disabled={downloading}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      {downloading ? 'Creating Zip...' : 'Download Zip'}
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  </>
                )}
                {files.length > 0 && selectedFiles.size === 0 && (
                  <button
                    onClick={selectAllFiles}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                )}
              </div>
            </div>
            
            {downloadProgress && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Downloading {downloadProgress.current} of {downloadProgress.total} files...</span>
                  <span>{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading files...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                <p>{error}</p>
                <button
                  onClick={() => loadFiles(navigation)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>This folder is empty</p>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <CheckSquare className="h-4 w-4" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map(file => (
                    <tr key={file.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleFileSelection(file.id)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          {selectedFiles.has(file.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {isFolder(file) ? (
                            <Folder className="h-5 w-5 text-blue-500 mr-3" />
                          ) : (
                            <File className="h-5 w-5 text-gray-400 mr-3" />
                          )}
                          {isFolder(file) ? (
                            <button
                              onClick={() => navigateToFolder(file)}
                              className="text-blue-600 hover:underline"
                            >
                              {file.name}
                            </button>
                          ) : (
                            <span className="text-gray-900">{file.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(getModifiedTime(file))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(getFileSize(file))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  )
}