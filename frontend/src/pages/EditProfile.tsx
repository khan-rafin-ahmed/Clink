import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { getUserProfile, updateUserProfile, createUserProfile } from '@/lib/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AvatarUpload } from '@/components/AvatarUpload'
import { toast } from 'sonner'
import { ArrowLeft, User, Save, Loader2 } from 'lucide-react'
import type { UserProfile } from '@/types'

const DRINK_OPTIONS = [
  { value: 'beer', label: '🍺 Beer', emoji: '🍺' },
  { value: 'wine', label: '🍷 Wine', emoji: '🍷' },
  { value: 'cocktails', label: '🍸 Cocktails', emoji: '🍸' },
  { value: 'whiskey', label: '🥃 Whiskey', emoji: '🥃' },
  { value: 'vodka', label: '🍸 Vodka', emoji: '🍸' },
  { value: 'rum', label: '🍹 Rum', emoji: '🍹' },
  { value: 'tequila', label: '🥃 Tequila', emoji: '🥃' },
  { value: 'gin', label: '🍸 Gin', emoji: '🍸' },
  { value: 'champagne', label: '🥂 Champagne', emoji: '🥂' },
  { value: 'sake', label: '🍶 Sake', emoji: '🍶' },
  { value: 'other', label: '🍻 Other', emoji: '🍻' }
]

export function EditProfile() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    favorite_drink: '',
    avatar_url: ''
  })

  const loadProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)

    try {
      // Try to get profile with basic fields first
      let profileData = await getUserProfile(user.id)

      // If no profile exists, create one
      if (!profileData) {
        try {
          const defaultDisplayName = user.email?.split('@')[0] || 'User'
          profileData = await createUserProfile(user.id, {
            display_name: defaultDisplayName
          })
        } catch (createError: any) {
          console.error('Profile creation error:', createError)
          // If profile creation fails due to duplicate key, try to fetch again
          if (createError.code === '23505') {
            profileData = await getUserProfile(user.id)
          } else {
            throw createError
          }
        }
      }

      // If we still don't have a profile, create a minimal one
      if (!profileData) {
        profileData = {
          id: '',
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'User',
          bio: null,
          avatar_url: null,
          favorite_drink: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      setProfile(profileData)
      setFormData({
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        favorite_drink: profileData.favorite_drink || 'none',
        avatar_url: profileData.avatar_url || ''
      })
      setHasLoaded(true)
    } catch (error: any) {
      console.error('Error loading profile:', error)

      // Provide more specific error messages
      if (error.message?.includes('Content-Length')) {
        toast.error('Database connection issue. The favorite_drink column may not exist yet.')
      } else if (error.code === 'PGRST116') {
        toast.error('Profile not found. Creating a new one...')
      } else {
        toast.error(`Failed to load profile: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    if (user && !hasLoaded) {
      loadProfile()
    }
  }, [user?.id, authLoading, navigate, hasLoaded, loadProfile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    const updateData = {
      display_name: formData.display_name.trim() || null,
      bio: formData.bio.trim() || null,
      favorite_drink: formData.favorite_drink === 'none' ? null : formData.favorite_drink || null,
      avatar_url: formData.avatar_url.trim() || null
    }

    console.log('[EditProfile] Saving profile with data:', updateData)
    setSaving(true)
    try {
      const result = await updateUserProfile(user.id, updateData)
      console.log('[EditProfile] Profile update result:', result)

      toast.success('Profile updated successfully! 🎉')
      navigate('/profile')
    } catch (error) {
      console.error('[EditProfile] Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    console.log('[EditProfile] Field changed:', field, '=', value)
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <User className="h-8 w-8" />
              Edit Profile
            </h1>
            <p className="text-muted-foreground">
              Update your profile information
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <AvatarUpload
                currentAvatarUrl={formData.avatar_url}
                fallbackText={formData.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                onAvatarChange={(url) => handleInputChange('avatar_url', url)}
                userId={user.id}
                disabled={saving}
              />

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  type="text"
                  placeholder="Your display name"
                  value={formData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  This is how others will see your name
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.bio.length}/200 characters
                </p>
              </div>

              {/* Favorite Drink */}
              <div className="space-y-2">
                <Label htmlFor="favorite_drink">Favorite Drink (Optional)</Label>
                <Select
                  value={formData.favorite_drink}
                  onValueChange={(value) => handleInputChange('favorite_drink', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your favorite drink" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No preference</SelectItem>
                    {DRINK_OPTIONS.map((drink) => (
                      <SelectItem key={drink.value} value={drink.value}>
                        {drink.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Let others know what you like to drink
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link to="/profile">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
