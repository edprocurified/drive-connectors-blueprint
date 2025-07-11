import { Client } from '@microsoft/microsoft-graph-client'
import JSZip from 'jszip'
import { MicrosoftDriveFile } from '../types'

export class MicrosoftGraphService {
  private client: Client

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken)
      }
    })
  }

  async listFiles(folderId: string = 'root', nextLink?: string) {
    try {
      let response
      
      if (nextLink) {
        response = await this.client.api(nextLink).get()
      } else {
        const endpoint = folderId === 'root' 
          ? '/me/drive/root/children'
          : `/me/drive/items/${folderId}/children`
        
        response = await this.client
          .api(endpoint)
          .select('id,name,folder,file,size,lastModifiedDateTime,parentReference,webUrl,@microsoft.graph.downloadUrl')
          .orderby('name')
          .top(100)
          .get()
      }
      
      const files = response.value as MicrosoftDriveFile[]
      
      // Sort manually: folders first, then files, both alphabetically
      const sortedFiles = files.sort((a, b) => {
        const aIsFolder = !!a.folder
        const bIsFolder = !!b.folder
        
        if (aIsFolder && !bIsFolder) return -1
        if (!aIsFolder && bIsFolder) return 1
        
        return a.name.localeCompare(b.name)
      })
      
      return {
        files: sortedFiles,
        nextPageToken: response['@odata.nextLink']
      }
    } catch (error) {
      console.error('Error listing files:', error)
      throw error
    }
  }

  async downloadFile(fileId: string) {
    try {
      const metadata = await this.client
        .api(`/me/drive/items/${fileId}`)
        .select('@microsoft.graph.downloadUrl')
        .get()
      
      if (metadata['@microsoft.graph.downloadUrl']) {
        const response = await fetch(metadata['@microsoft.graph.downloadUrl'])
        return await response.blob()
      } else {
        throw new Error('Download URL not available')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }

  async getFileMetadata(fileId: string) {
    try {
      const response = await this.client
        .api(`/me/drive/items/${fileId}`)
        .select('id,name,folder,file,size,lastModifiedDateTime,parentReference,webUrl,@microsoft.graph.downloadUrl')
        .get()
      
      return response as MicrosoftDriveFile
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  }

  async downloadMultipleFiles(files: MicrosoftDriveFile[], _zipName: string, onProgress?: (current: number, total: number) => void) {
    const zip = new JSZip()
    let completed = 0
    let totalFiles = 0

    // First, count total files (including nested ones)
    const countFiles = async (items: MicrosoftDriveFile[]): Promise<number> => {
      let count = 0
      for (const item of items) {
        if (item.folder) {
          const { files: folderFiles } = await this.listFiles(item.id)
          count += await countFiles(folderFiles)
        } else {
          count++
        }
      }
      return count
    }

    totalFiles = await countFiles(files)

    // Recursively download files maintaining folder structure
    const downloadRecursively = async (items: MicrosoftDriveFile[], basePath: string = '') => {
      for (const item of items) {
        try {
          if (item.folder) {
            // Create folder in zip and download its contents
            const folderPath = basePath ? `${basePath}/${item.name}` : item.name
            const { files: folderFiles } = await this.listFiles(item.id)
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

  async downloadFolderContents(folderId: string, folderName: string, onProgress?: (current: number, total: number) => void) {
    try {
      const { files } = await this.listFiles(folderId)
      
      if (files.length === 0) {
        throw new Error('Folder is empty')
      }

      return await this.downloadMultipleFiles(files, `${folderName}.zip`, onProgress)
    } catch (error) {
      console.error('Error downloading folder contents:', error)
      throw error
    }
  }
}