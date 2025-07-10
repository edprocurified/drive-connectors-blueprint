import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GoogleDriveService } from '../services/googleDrive'
import { MicrosoftGraphService } from '../services/microsoftGraph'
import { DriveFile } from '../types'
import { Folder, File, Download, LogOut, ChevronRight, Home } from 'lucide-react'

export default function FileBrowser() {
  const { isAuthenticated, tokens, logout, provider } = useAuth()
  const navigate = useNavigate()
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }>({ id: 'root', name: 'My Drive' })
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'My Drive' }])

  console.log('FileBrowser render:', { isAuthenticated, tokens, provider, loading, error, filesCount: files.length })

  const loadFiles = useCallback(async (folderId: string) => {
    console.log('loadFiles called:', { folderId, provider, hasTokens: !!tokens })
    setLoading(true)
    setError(null)
    
    try {
      if (provider === 'google') {
        console.log('Using Google Drive service')
        const driveService = new GoogleDriveService(tokens!.access_token)
        const { files } = await driveService.listFiles(folderId)
        console.log('Google files loaded:', files.length)
        setFiles(files)
      } else if (provider === 'microsoft') {
        console.log('Using Microsoft Graph service')
        const graphService = new MicrosoftGraphService(tokens!.access_token)
        const { files } = await graphService.listFiles(folderId)
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
      loadFiles(currentFolder.id)
    }
  }, [currentFolder, tokens, loadFiles])

  const navigateToFolder = (file: DriveFile) => {
    setCurrentFolder({ id: file.id, name: file.name })
    setBreadcrumb([...breadcrumb, { id: file.id, name: file.name }])
  }

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1)
    setBreadcrumb(newBreadcrumb)
    setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1])
  }

  const downloadFile = async (file: DriveFile) => {
    try {
      let blob: Blob
      
      if (provider === 'google') {
        const driveService = new GoogleDriveService(tokens!.access_token)
        blob = await driveService.downloadFile(file.id)
      } else {
        const graphService = new MicrosoftGraphService(tokens!.access_token)
        blob = await graphService.downloadFile(file.id)
      }
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Failed to download file')
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

  const canDownload = (file: DriveFile): boolean => {
    if (isFolder(file)) return false
    
    if ('webContentLink' in file) {
      return !!file.webContentLink
    } else {
      return true // Microsoft files can typically be downloaded
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
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
                  onClick={() => loadFiles(currentFolder.id)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map(file => (
                    <tr key={file.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {canDownload(file) && (
                          <button
                            onClick={() => downloadFile(file)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        )}
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
  )
}