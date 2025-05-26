import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { uploadAvatar, createFilePreview, cleanupFilePreview, validateFile } from '@/lib/fileUpload'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  fallbackText: string
  onAvatarChange: (url: string) => void
  userId: string
  disabled?: boolean
}

export function AvatarUpload({
  currentAvatarUrl,
  fallbackText,
  onAvatarChange,
  userId,
  disabled = false
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    // Clean up previous preview
    if (previewUrl) {
      cleanupFilePreview(previewUrl)
    }

    // Create new preview
    const preview = createFilePreview(file)
    setPreviewUrl(preview)
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    console.log('[AvatarUpload] Starting upload for user:', userId)
    setUploading(true)
    try {
      console.log('[AvatarUpload] Calling uploadAvatar...')
      const result = await uploadAvatar(selectedFile, userId)
      console.log('[AvatarUpload] Upload result:', result)

      console.log('[AvatarUpload] Calling onAvatarChange with URL:', result.url)
      onAvatarChange(result.url)

      // Clean up
      if (previewUrl) {
        cleanupFilePreview(previewUrl)
        setPreviewUrl(null)
      }
      setSelectedFile(null)

      toast.success('Avatar updated successfully! 🎉')
    } catch (error: any) {
      console.error('[AvatarUpload] Avatar upload error:', error)
      toast.error(`Failed to upload avatar: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (previewUrl) {
      cleanupFilePreview(previewUrl)
      setPreviewUrl(null)
    }
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const displayUrl = previewUrl || currentAvatarUrl

  return (
    <div className="flex items-center space-x-6">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={displayUrl} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {/* Camera overlay for upload button */}
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
        >
          <Camera className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Upload Controls */}
      <div className="flex-1 space-y-3">
        <Label className="text-sm font-medium">Profile Picture</Label>

        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!selectedFile ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={disabled || uploading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose Photo
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleUpload}
                disabled={disabled || uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="text-xs text-muted-foreground">
            Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP. Max 5MB.
        </p>
      </div>
    </div>
  )
}
