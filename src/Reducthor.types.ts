import { AxiosError, AxiosResponse } from 'axios'

export interface ReducthorAction {
  method?: 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put'
  name: string
  path?: string
  private?: boolean
  type?: 'request' | 'simple'
  action?(state: any, ...args: any[]): any
  onAction?(state: any, ...args: any[]): any
  onRequestOk?(state: any, request: AxiosResponse, ...args: any[]): any
  onRequestError?(state: any, error: AxiosError, ...args: any[]): any
  onUploadProgress?(state: any, progressEvent: any, ...args: any[]): any
  onDownloadProgress?(state: any, progressEvent: any, ...args: any[]): any
  onFinish?(state: any, ...args: any[]): any
}

export interface AuthConfig {
  header?: string
  token: string
}

export interface ReducthorConfiguration {
  baseUrl?: string
  authConfig?: AuthConfig
  actions: ReducthorAction[] | MultyAction
  composeWithDevTools?: any
  initialState?: any
  middleware?: any | any[]
}

export interface MultyAction {
  [reducerName: string]: ReducthorAction
}

export interface ReducthorInstance {
  [key: string]: any
  store: any
  configAuth(authConfig: AuthConfig): void
}
