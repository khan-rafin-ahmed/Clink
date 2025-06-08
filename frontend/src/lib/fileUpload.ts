import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
}

export interface UploadOptions {
  bucket: string
  folder?: string
  maxSizeBytes?: number
  allowedTypes?: string[]
}

const DEFAULT_OPTIONS: UploadOptions = {
  bucket: 'avatars',
  folder: undefined, // Don't use a subfolder, put user ID as first folder
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
}

/**
 * Validates file before upload
 */
export function validateFile(file: File, options: UploadOptions = DEFAULT_OPTIONS): string | null {
  // Check file size
  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    const maxSizeMB = Math.round(options.maxSizeBytes / (1024 * 1024))
    return `File size must be less than ${maxSizeMB}MB`
  }

  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return `File type not allowed. Supported types: ${options.allowedTypes.join(', ')}`
  }

  return null
}

/**
 * Generates a unique file path for upload
 * Format: {userId}/avatar_{timestamp}_{random}.{ext}
 */
export function generateFilePath(file: File, userId: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `avatar_${timestamp}_${randomString}.${fileExtension}`

  // Always put userId as the first folder for RLS policy
  return `${userId}/${fileName}`
}

/**
 * Uploads a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  userId: string,
  options: UploadOptions = DEFAULT_OPTIONS
): Promise<UploadResult> {
  console.log('[uploadFile] Starting upload:', { fileName: file.name, fileSize: file.size, userId, options })

  // Validate file
  const validationError = validateFile(file, options)
  if (validationError) {
    console.error('[uploadFile] Validation failed:', validationError)
    throw new Error(validationError)
  }

  // Generate unique file path
  const filePath = generateFilePath(file, userId)
  console.log('[uploadFile] Generated file path:', filePath)

  try {
    // Upload file to Supabase Storage
    console.log('[uploadFile] Uploading to bucket:', options.bucket)
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('[uploadFile] Upload response:', { data, error })

    if (error) {
      console.error('[uploadFile] Upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    console.log('[uploadFile] Getting public URL for path:', data.path)
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(data.path)

    console.log('[uploadFile] Public URL data:', urlData)

    const result = {
      url: urlData.publicUrl,
      path: data.path
    }

    console.log('[uploadFile] Upload successful:', result)
    return result
  } catch (error) {
    console.error('[uploadFile] File upload error:', error)
    throw error
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteFile(filePath: string, bucket: string = 'avatars'): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      throw new Error(`Delete failed: ${error.message}`)
    }
  } catch (error) {
    console.error('File delete error:', error)
    throw error
  }
}

/**
 * Uploads an avatar specifically
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, userId, {
    bucket: 'avatars',
    folder: undefined, // No subfolder, userId will be the first folder
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  })
}

/**
 * Uploads an event photo specifically
 */
export async function uploadEventPhoto(file: File, userId: string, eventId: string): Promise<UploadResult> {
  return uploadFile(file, userId, {
    bucket: 'event-photos',
    folder: eventId, // Group photos by event
    maxSizeBytes: 10 * 1024 * 1024, // 10MB for event photos
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  })
}

/**
 * Uploads an event cover image specifically
 */
export async function uploadEventCover(file: File, userId: string): Promise<UploadResult> {
  return uploadFile(file, userId, {
    bucket: 'event-covers',
    folder: 'covers', // Group all cover images in covers folder
    maxSizeBytes: 5 * 1024 * 1024, // 5MB for cover images
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  })
}

/**
 * Creates a preview URL for a file before upload
 */
export function createFilePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Cleans up a preview URL
 */
export function cleanupFilePreview(url: string): void {
  URL.revokeObjectURL(url)
}
