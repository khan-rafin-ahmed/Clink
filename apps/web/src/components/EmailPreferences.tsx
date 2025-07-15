import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { Mail, Bell, Users, Calendar, Loader2 } from 'lucide-react'

interface EmailPreferences {
  event_invitations: boolean
  event_reminders: boolean
  crew_invitations: boolean
  marketing_emails: boolean
  email_frequency: 'immediate' | 'daily' | 'weekly' | 'never'
}

export function EmailPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<EmailPreferences>({
    event_invitations: true,
    event_reminders: true,
    crew_invitations: true,
    marketing_emails: false,
    email_frequency: 'immediate'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadPreferences()
    }
  }, [user])

  const loadPreferences = async () => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .rpc('get_user_email_preferences', {
          p_user_id: user?.id
        })

      if (error) {
        console.error('Failed to load email preferences:', error)
        toast.error('Failed to load email preferences')
        return
      }

      if (data && data.length > 0) {
        setPreferences(data[0])
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load email preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save email preferences:', error)
        toast.error('Failed to save preferences')
        return
      }

      toast.success('📧 Email preferences saved!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = (key: keyof EmailPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (!user) {
    return (
      <Card className="glass-card border-white/10">
        <CardContent className="p-6">
          <p className="text-center text-[#B3B3B3]">Please sign in to manage email preferences</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Mail className="w-5 h-5" />
          Email Preferences
        </CardTitle>
        <p className="text-sm text-[#B3B3B3]">
          Control when and how you receive email notifications from Thirstee
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
            <span className="ml-2 text-[#B3B3B3]">Loading preferences...</span>
          </div>
        ) : (
          <>
            {/* Event Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Notifications
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Event Invitations</Label>
                    <p className="text-sm text-[#B3B3B3]">
                      Get notified when someone invites you to a drinking session
                    </p>
                  </div>
                  <Switch
                    checked={preferences.event_invitations}
                    onCheckedChange={(checked) => updatePreference('event_invitations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-white">Event Reminders</Label>
                    <p className="text-sm text-[#B3B3B3]">
                      Get reminded 1 hour before events you're attending
                    </p>
                  </div>
                  <Switch
                    checked={preferences.event_reminders}
                    onCheckedChange={(checked) => updatePreference('event_reminders', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Crew Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Crew Notifications
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Crew Invitations</Label>
                  <p className="text-sm text-[#B3B3B3]">
                    Get notified when someone invites you to join their crew
                  </p>
                </div>
                <Switch
                  checked={preferences.crew_invitations}
                  onCheckedChange={(checked) => updatePreference('crew_invitations', checked)}
                />
              </div>
            </div>

            {/* Marketing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Marketing & Updates
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Marketing Emails</Label>
                  <p className="text-sm text-[#B3B3B3]">
                    Receive updates about new features and special events
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing_emails}
                  onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
                />
              </div>
            </div>

            {/* Email Frequency */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Email Frequency</h3>
              
              <div className="space-y-2">
                <Label className="text-white">How often do you want to receive emails?</Label>
                <Select
                  value={preferences.email_frequency}
                  onValueChange={(value) => updatePreference('email_frequency', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-[#B3B3B3]">
                  {preferences.email_frequency === 'immediate' && 'Get emails as soon as events happen'}
                  {preferences.email_frequency === 'daily' && 'Get a daily summary of notifications'}
                  {preferences.email_frequency === 'weekly' && 'Get a weekly summary of notifications'}
                  {preferences.email_frequency === 'never' && 'No email notifications (app notifications only)'}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-white/10">
              <Button
                onClick={savePreferences}
                disabled={isSaving}
                className="w-full bg-[#FF7747] hover:bg-[#e66a42] text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-[#B3B3B3]">
                💡 <strong className="text-white">Pro tip:</strong> You can always change these settings later. 
                Critical notifications (like password resets) will always be sent regardless of your preferences.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
