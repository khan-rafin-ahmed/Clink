import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateEventMetaTags, generateCrewMetaTags, generateAppMetaTags, applyMetaTags, resetMetaTags } from '@/lib/metaTagService'
import { Copy, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function TestMetaTags() {
  const [currentMeta, setCurrentMeta] = useState<any>(null)
  const [testEvent] = useState({
    title: "Epic Rooftop Party 🎉",
    description: "Join us for an unforgettable night of drinks, music, and good vibes on the rooftop! Bring your crew and let's raise some hell together. 🍺🤘",
    cover_image_url: null, // Will use default vibe image
    vibe: "party",
    date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    location: "Sky Bar, Downtown",
    place_nickname: "The Legendary Sky Bar",
    is_public: true
  })

  const [testCrew] = useState({
    name: "The Wild Ones 🔥",
    description: "Crew for epic nights, wild adventures, and unforgettable memories. We don't just party - we create legends.",
    vibe: "wild",
    member_count: 12,
    is_public: true
  })

  useEffect(() => {
    // Apply app meta tags by default
    const appMeta = generateAppMetaTags()
    applyMetaTags(appMeta)
    setCurrentMeta({ type: 'app', data: appMeta })

    return () => {
      resetMetaTags()
    }
  }, [])

  const testEventMeta = () => {
    const eventUrl = `${window.location.origin}/event/test-epic-rooftop-party`
    const eventMeta = generateEventMetaTags(testEvent, eventUrl)
    applyMetaTags(eventMeta)
    setCurrentMeta({ type: 'event', data: eventMeta })
    toast.success('🏷️ Event meta tags applied!')
  }

  const testCrewMeta = () => {
    const crewUrl = `${window.location.origin}/crew/test-wild-ones`
    const crewMeta = generateCrewMetaTags(testCrew, crewUrl)
    applyMetaTags(crewMeta)
    setCurrentMeta({ type: 'crew', data: crewMeta })
    toast.success('🏷️ Crew meta tags applied!')
  }

  const testAppMeta = () => {
    const appMeta = generateAppMetaTags()
    applyMetaTags(appMeta)
    setCurrentMeta({ type: 'app', data: appMeta })
    toast.success('🏷️ App meta tags applied!')
  }

  const copyMetaData = () => {
    if (currentMeta) {
      navigator.clipboard.writeText(JSON.stringify(currentMeta.data, null, 2))
      toast.success('📋 Meta data copied to clipboard!')
    }
  }

  const viewPageSource = () => {
    // Open view-source in new tab
    window.open(`view-source:${window.location.href}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Meta Tags Test Page</h1>
          <p className="text-[#B3B3B3]">Test dynamic meta tag generation for social media sharing</p>
        </div>

        {/* Test Controls */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={testAppMeta} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test App Meta Tags
              </Button>
              <Button onClick={testEventMeta} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Event Meta Tags
              </Button>
              <Button onClick={testCrewMeta} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Crew Meta Tags
              </Button>
              <Button onClick={copyMetaData} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy Meta Data
              </Button>
              <Button onClick={viewPageSource} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Page Source
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Meta Tags */}
        {currentMeta && (
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Current Meta Tags
                <Badge variant="outline" className="text-[#FF7747] border-[#FF7747]">
                  {currentMeta.type === 'app' ? 'App' : currentMeta.type === 'crew' ? 'Crew' : 'Event'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">Title</h3>
                  <p className="text-[#B3B3B3] text-sm bg-white/5 p-3 rounded">
                    {currentMeta.data.title}
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Description</h3>
                  <p className="text-[#B3B3B3] text-sm bg-white/5 p-3 rounded">
                    {currentMeta.data.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Image URL</h3>
                  <p className="text-[#B3B3B3] text-sm bg-white/5 p-3 rounded break-all">
                    {currentMeta.data.image}
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Page URL</h3>
                  <p className="text-[#B3B3B3] text-sm bg-white/5 p-3 rounded break-all">
                    {currentMeta.data.url}
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {currentMeta.data.image && (
                <div>
                  <h3 className="text-white font-semibold mb-2">Image Preview</h3>
                  <div className="bg-white/5 p-4 rounded">
                    <img 
                      src={currentMeta.data.image} 
                      alt="Meta tag preview"
                      className="max-w-full h-auto rounded border border-white/10"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const errorDiv = document.createElement('div')
                        errorDiv.className = 'text-red-400 text-sm p-4 bg-red-900/20 rounded'
                        errorDiv.textContent = 'Image failed to load: ' + target.src
                        target.parentNode?.appendChild(errorDiv)
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Test Event Preview */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Test Event Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/5 p-4 rounded">
              <pre className="text-[#B3B3B3] text-sm overflow-x-auto">
                {JSON.stringify(testEvent, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Test Crew Preview */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Test Crew Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white/5 p-4 rounded">
              <pre className="text-[#B3B3B3] text-sm overflow-x-auto">
                {JSON.stringify(testCrew, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">How to Test Social Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-[#B3B3B3] space-y-2">
              <p><strong className="text-white">1. Facebook Debugger:</strong></p>
              <p className="ml-4">Visit <a href="https://developers.facebook.com/tools/debug/" target="_blank" className="text-[#FF7747] hover:underline">Facebook Sharing Debugger</a> and enter this page URL</p>
              
              <p><strong className="text-white">2. Twitter Card Validator:</strong></p>
              <p className="ml-4">Visit <a href="https://cards-dev.twitter.com/validator" target="_blank" className="text-[#FF7747] hover:underline">Twitter Card Validator</a> and enter this page URL</p>
              
              <p><strong className="text-white">3. LinkedIn Post Inspector:</strong></p>
              <p className="ml-4">Visit <a href="https://www.linkedin.com/post-inspector/" target="_blank" className="text-[#FF7747] hover:underline">LinkedIn Post Inspector</a> and enter this page URL</p>
              
              <p><strong className="text-white">4. Manual Testing:</strong></p>
              <p className="ml-4">Copy this page URL and paste it in social media posts to see the preview</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
