// Stub: file persistence types (feature-gated, not in source map)
export const DEFAULT_UPLOAD_CONCURRENCY = 5
export const FILE_COUNT_LIMIT = 1000
export const OUTPUTS_SUBDIR = 'outputs'

export interface FailedPersistence {
  path: string
  error: string
}

export interface FilesPersistedEventData {
  fileCount: number
  totalSize: number
  failedCount: number
}

export interface PersistedFile {
  path: string
  size: number
  id?: string
}

export interface TurnStartTime {
  timestamp: number
}

export interface FilePersistenceState {}
export type FilePersistenceConfig = Record<string, unknown>
