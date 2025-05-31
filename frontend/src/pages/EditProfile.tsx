import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useActionNavigation, useSmartNavigation } from '@/hooks/useSmartNavigation'
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
  const { handleUpdateSuccess } = useActionNavigation()
  const { goBackSmart } = useSmartNavigation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    tagline: '',
    favorite_drink: '',
    avatar_url: '',
    profile_visibility: 'public' as 'public' | 'crew_only' | 'private',
    show_crews_publicly: true
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
          tagline: null,
          avatar_url: null,
          favorite_drink: null,
          join_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      setProfile(profileData)
      setFormData({
        display_name: profileData?.display_name || '',
        bio: profileData?.bio || '',
        tagline: profileData?.tagline || '',
        favorite_drink: profileData?.favorite_drink || 'none',
        avatar_url: profileData?.avatar_url || '',
        profile_visibility: profileData?.profile_visibility || 'public',
        show_crews_publicly: profileData?.show_crews_publicly ?? true
      })
      setHasLoaded(true)
    } catch (error: any) {
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
      tagline: formData.tagline.trim() || null,
      favorite_drink: formData.favorite_drink === 'none' ? null : formData.favorite_drink || null,
      avatar_url: formData.avatar_url.trim() || null,
      profile_visibility: formData.profile_visibility,
      show_crews_publicly: formData.show_crews_publicly
    }

    console.log('[EditProfile] Saving profile with data:', updateData)
    setSaving(true)
    try {
      const result = await updateUserProfile(user.id, updateData)
      console.log('[EditProfile] Profile update result:', result)

      toast.success('Profile updated successfully! 🎉')
      handleUpdateSuccess()
    } catch (error) {
      console.error('[EditProfile] Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    console.log('[EditProfile] Field changed:', field, '=', value)
    setFormData(prev => ({
      ...prev,
      [field]: field === 'show_crews_publicly' ? value === 'true' || value === true : value
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
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
          <Button variant="outline" size="sm" onClick={goBackSmart}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
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

              {/* Tagline */}
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  type="text"
                  placeholder="Your personal motto or catchphrase..."
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.tagline.length}/100 characters - A short phrase that represents you
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

              {/* Privacy Settings */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground">Privacy Settings</h3>

                {/* Profile Visibility */}
                <div className="space-y-2">
                  <Label htmlFor="profile_visibility">Who can view your profile?</Label>
                  <Select
                    value={formData.profile_visibility}
                    onValueChange={(value: 'public' | 'crew_only' | 'private') =>
                      handleInputChange('profile_visibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">🌍 Public - Anyone can view</SelectItem>
                      <SelectItem value="crew_only">👥 Crew Only - Only crew members can view</SelectItem>
                      <SelectItem value="private">🔒 Private - Only you can view</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.profile_visibility === 'public' && 'Your profile will be visible to everyone who views events you attend or host'}
                    {formData.profile_visibility === 'crew_only' && 'Only people in your crews can view your profile details'}
                    {formData.profile_visibility === 'private' && 'Your profile is completely private - others will only see your name'}
                  </p>
                </div>

                {/* Show Crews Publicly */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show_crews_publicly"
                      checked={formData.show_crews_publicly}
                      onChange={(e) => handleInputChange('show_crews_publicly', e.target.checked.toString())}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="show_crews_publicly">Show my crews on my profile</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, others can see which crews you're part of (respects crew visibility settings)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={goBackSmart}>
                  Cancel
                </Button>
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
