import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, X, Trash2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getEventPhotos, uploadEventPhoto, deleteEventPhoto } from '@/lib/eventMediaService'
import type { EventPhoto } from '@/types'

interface EventGalleryProps {
  eventId: string
  canUpload: boolean
  canModerate: boolean
}

export function EventGallery({ eventId, canUpload, canModerate }: EventGalleryProps) {
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPhotos()
  }, [eventId])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      const eventPhotos = await getEventPhotos(eventId)
      setPhotos(eventPhotos)
    } catch (error: any) {
      console.error('Error loading photos:', error)
      if (!error.message?.includes('attended')) {
        toast.error('Failed to load photos')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    uploadPhoto(file)
  }

  const uploadPhoto = async (file: File, caption?: string) => {
    try {
      setUploading(true)
      const newPhoto = await uploadEventPhoto(eventId, file, caption)
      setPhotos(prev => [newPhoto, ...prev])
      toast.success('Photo uploaded successfully! 📸')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photo: EventPhoto) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      await deleteEventPhoto(photo.id)
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      setSelectedPhoto(null)
      toast.success('Photo deleted')
    } catch (error: any) {
      console.error('Error deleting photo:', error)
      toast.error(error.message || 'Failed to delete photo')
    }
  }

  const canDeletePhoto = (photo: EventPhoto, currentUserId?: string): boolean => {
    if (!currentUserId) return false
    return photo.uploaded_by === currentUserId || canModerate
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Event Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Event Gallery ({photos.length})
          </CardTitle>

          {canUpload && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Photo
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No photos yet. {canUpload ? 'Be the first to share a memory!' : 'Check back later for photos.'}
            </p>
            {canUpload && (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload First Photo
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || 'Event photo'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                {/* Photo overlay with uploader info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={photo.uploader?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {photo.uploader?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white text-xs font-medium">
                      {photo.uploader?.display_name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || 'Event photo'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            {/* Photo details */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedPhoto.uploader?.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedPhoto.uploader?.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">
                      {selectedPhoto.uploader?.display_name || 'Unknown'}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {new Date(selectedPhoto.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {canDeletePhoto(selectedPhoto) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePhoto(selectedPhoto)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>

              {selectedPhoto.caption && (
                <p className="text-white mt-2">{selectedPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
