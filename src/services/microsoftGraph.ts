import { Client } from '@microsoft/microsoft-graph-client'
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
}