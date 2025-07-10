import axios from 'axios'
import { GoogleDriveFile } from '../types'

const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

export class GoogleDriveService {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async listFiles(folderId: string = 'root', pageToken?: string) {
    try {
      const response = await axios.get(`${GOOGLE_DRIVE_API_BASE}/files`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        },
        params: {
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, parents, webViewLink, webContentLink, iconLink)',
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
      console.error('Error listing files:', error)
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
}