export type Provider = 'google' | 'microsoft'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  size?: string
  parents?: string[]
  webViewLink?: string
  webContentLink?: string
  iconLink?: string
}

export interface MicrosoftDriveFile {
  id: string
  name: string
  folder?: { childCount: number }
  file?: { mimeType: string }
  size?: number
  lastModifiedDateTime: string
  parentReference?: { id: string }
  webUrl?: string
  '@microsoft.graph.downloadUrl'?: string
}

export type DriveFile = GoogleDriveFile | MicrosoftDriveFile

export interface AuthTokens {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  refresh_token?: string
  provider: Provider
}

export interface AuthState {
  isAuthenticated: boolean
  tokens: AuthTokens | null
  loading: boolean
  provider: Provider | null
}