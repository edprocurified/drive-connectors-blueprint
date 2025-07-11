import axios from 'axios'
import JSZip from 'jszip'
import { GoogleDriveFile } from '../types'

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

export class GoogleDriveService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async listFiles(folderId: string = 'root', pageToken?: string, driveId?: string) {
    try {
      const baseParams = {
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webViewLink, webContentLink, iconLink, shared, sharedWithMeTime)',
        orderBy: 'folder,name',
        pageSize: 100,
        pageToken
      }

      let params
      if (driveId) {
        // Shared drive - need to use corpora parameter
        const query = folderId === 'root' 
          ? `'${driveId}' in parents and trashed = false`  // Use driveId as parent for root
          : `'${folderId}' in parents and trashed = false`
        
        params = {
          ...baseParams,
          driveId,
          corpora: 'drive',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true,
          q: query
        }
      } else {
        // Regular drive
        params = {
          ...baseParams,
          q: `'${folderId}' in parents and trashed = false`
        }
      }

      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/files`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params
      })
      
      return {
        files: response.data.files as GoogleDriveFile[],
        nextPageToken: response.data.nextPageToken
      }
    } catch (error: unknown) {
      console.error('Error listing files:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: unknown; status: number } }
        console.error('Error response data:', axiosError.response.data)
        console.error('Error response status:', axiosError.response.status)
      }
      throw error
    }
  }

  async listSharedDrives() {
    try {
      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/drives`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          fields: 'drives(id, name)',
          pageSize: 100
        }
      })
      
      return response.data.drives || []
    } catch (error: unknown) {
      console.error('Error listing shared drives:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data: unknown } }
        console.error('Shared drives error response:', axiosError.response.data)
      }
      // Return empty array if shared drives API fails (user might not have access)
      return []
    }
  }

  async listSharedWithMe(pageToken?: string) {
    try {
      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/files`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          q: 'sharedWithMe = true and trashed = false',
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webViewLink, webContentLink, iconLink, shared, sharedWithMeTime)',
          orderBy: 'folder,name',
          pageSize: 100,
          pageToken
        }
      })
      
      return {
        files: response.data.files as GoogleDriveFile[],
        nextPageToken: response.data.nextPageToken
      }
    } catch (error) {
      console.error('Error listing shared files:', error)
      throw error
    }
  }

  async listRecent(pageToken?: string) {
    try {
      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/files`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          q: 'trashed = false',
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webViewLink, webContentLink, iconLink)',
          orderBy: 'modifiedTime desc',
          pageSize: 100,
          pageToken
        }
      })
      
      return {
        files: response.data.files as GoogleDriveFile[],
        nextPageToken: response.data.nextPageToken
      }
    } catch (error) {
      console.error('Error listing recent files:', error)
      throw error
    }
  }

  async downloadFile(fileId: string) {
    try {
      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          alt: 'media'
        },
        responseType: 'blob'
      })
      
      return response.data
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }

  async getFileMetadata(fileId: string) {
    try {
      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          fields: 'id, name, mimeType, modifiedTime, size, parents, webViewLink, webContentLink, iconLink'
        }
      })
      
      return response.data as GoogleDriveFile
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  }

  async downloadMultipleFiles(files: GoogleDriveFile[], _zipName: string, onProgress?: (current: number, total: number) => void, driveId?: string) {
    const zip = new JSZip()
    let completed = 0
    let totalFiles = 0

    // First, count total files (including nested ones)
    const countFiles = async (items: GoogleDriveFile[]): Promise<number> => {
      let count = 0
      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const { files: folderFiles } = await this.listFiles(item.id, undefined, driveId)
          count += await countFiles(folderFiles)
        } else {
          count++
        }
      }
      return count
    }

    totalFiles = await countFiles(files)

    // Recursively download files maintaining folder structure
    const downloadRecursively = async (items: GoogleDriveFile[], basePath: string = '') => {
      for (const item of items) {
        try {
          if (item.mimeType === 'application/vnd.google-apps.folder') {
            // Create folder in zip and download its contents
            const folderPath = basePath ? `${basePath}/${item.name}` : item.name
            const { files: folderFiles } = await this.listFiles(item.id, undefined, driveId)
            await downloadRecursively(folderFiles, folderPath)
          } else {
            // Download file
            const blob = await this.downloadFile(item.id)
            const filePath = basePath ? `${basePath}/${item.name}` : item.name
            zip.file(filePath, blob)
            completed++
            onProgress?.(completed, totalFiles)
          }
        } catch (error) {
          console.warn(`Failed to download ${item.name}:`, error)
          // Continue with other files even if one fails
        }
      }
    }

    await downloadRecursively(files)
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    return zipBlob
  }

  async downloadFolderContents(folderId: string, folderName: string, driveId?: string, onProgress?: (current: number, total: number) => void) {
    try {
      // Get all files in the folder (recursively if needed)
      const { files } = await this.listFiles(folderId, undefined, driveId)
      
      if (files.length === 0) {
        throw new Error('Folder is empty')
      }

      const zipName = `${folderName}.zip`
      return await this.downloadMultipleFiles(files, zipName, onProgress)
    } catch (error) {
      console.error('Error downloading folder contents:', error)
      throw error
    }
  }
}