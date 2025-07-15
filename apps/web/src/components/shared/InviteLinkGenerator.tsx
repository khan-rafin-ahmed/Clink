import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Link, Copy } from 'lucide-react'

interface InviteLinkGeneratorProps {
  onGenerate: () => Promise<string>
  label?: string
  generateButtonText?: string
}

export function InviteLinkGenerator({ 
  onGenerate, 
  label = "Shareable Invite Link",
  generateButtonText = "Generate Link"
}: InviteLinkGeneratorProps) {
  const [link, setLink] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      const newLink = await onGenerate()
      setLink(newLink)
      toast.success('🔗 Invite link generated!')
    } catch (error: any) {
      console.error('Error generating link:', error)
      toast.error(error.message || 'Failed to generate link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast.success('📋 Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-white text-sm font-medium">{label}</Label>
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Link className="w-4 h-4 mr-2" />
                {generateButtonText}
              </>
            )}
          </Button>
        </div>
      </div>

      {link && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={link}
              readOnly
              className="bg-gray-900 border-gray-700 text-white"
            />
            <Button
              type="button"
              onClick={handleCopy}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Share this link with people you want to invite.
          </p>
        </div>
      )}
    </div>
  )
}
