import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function StyleGuide() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground">
            Thirstee Design System
          </h1>
          <p className="text-lg sm:text-xl text-primary font-heading font-semibold">
            TAP. PLAN. THIRSTEE.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            A comprehensive style guide showcasing our enhanced black & gold design system
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Color Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded-lg border"></div>
              <p className="text-sm font-medium">Primary Gold</p>
              <p className="text-xs text-muted-foreground">hsl(43 74% 49%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-primary-hover rounded-lg border"></div>
              <p className="text-sm font-medium">Primary Hover</p>
              <p className="text-xs text-muted-foreground">hsl(43 74% 55%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-card rounded-lg border"></div>
              <p className="text-sm font-medium">Card Background</p>
              <p className="text-xs text-muted-foreground">hsl(0 0% 5.5%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-card-hover rounded-lg border"></div>
              <p className="text-sm font-medium">Card Hover</p>
              <p className="text-xs text-muted-foreground">hsl(0 0% 7%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-accent rounded-lg border"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">hsl(43 30% 25%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-success rounded-lg border"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-muted-foreground">hsl(142 76% 36%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-warning rounded-lg border"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-muted-foreground">hsl(38 92% 50%)</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-destructive rounded-lg border"></div>
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground">hsl(0 84% 60%)</p>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Typography</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-6xl font-display font-bold text-foreground">Display Heading</h1>
              <p className="text-sm text-muted-foreground">font-display text-6xl font-bold</p>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-heading font-semibold text-foreground">Section Heading</h2>
              <p className="text-sm text-muted-foreground">font-heading text-4xl font-semibold</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-heading font-medium text-foreground">Subsection Heading</h3>
              <p className="text-sm text-muted-foreground">font-heading text-2xl font-medium</p>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-foreground">Large body text for important content</p>
              <p className="text-sm text-muted-foreground">text-lg</p>
            </div>
            <div className="space-y-2">
              <p className="text-base text-foreground">Regular body text for general content</p>
              <p className="text-sm text-muted-foreground">text-base</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Small text for captions and metadata</p>
              <p className="text-xs text-muted-foreground">text-sm text-muted-foreground</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Buttons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Primary Buttons</h3>
              <div className="space-y-3">
                <Button size="lg" className="w-full">🍺 Large Primary</Button>
                <Button className="w-full">Default Primary</Button>
                <Button size="sm" className="w-full">Small Primary</Button>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Secondary Buttons</h3>
              <div className="space-y-3">
                <Button variant="outline" size="lg" className="w-full">Large Outline</Button>
                <Button variant="outline" className="w-full">Default Outline</Button>
                <Button variant="outline" size="sm" className="w-full">Small Outline</Button>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Other Variants</h3>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full">Secondary</Button>
                <Button variant="ghost" className="w-full">Ghost</Button>
                <Button variant="destructive" className="w-full">Destructive</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cards & Components */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Cards & Components</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🍻 Interactive Card
                  <Badge>New</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  This card demonstrates the hover-lift effect and interactive styling.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Action</Button>
                  <Button variant="outline" size="sm">Secondary</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="interactive-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚡ Enhanced Card
                  <Badge variant="secondary">Featured</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  This card uses the interactive-card class for enhanced hover effects.
                </p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>TH</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Thirstee User</p>
                    <p className="text-sm text-muted-foreground">Ready to raise hell</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Form Elements */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Form Elements</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Input Field</label>
                <Input placeholder="Enter your text here..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Textarea</label>
                <Textarea placeholder="Enter your message..." rows={3} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Badges</label>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Avatars</label>
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>MD</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>LG</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Micro-interactions */}
        <section className="space-y-6">
          <h2 className="text-3xl font-display font-bold text-foreground">Micro-interactions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover-lift p-4 text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p className="font-medium">Hover Lift</p>
              <p className="text-sm text-muted-foreground">hover-lift</p>
            </Card>
            <Card className="hover-scale p-4 text-center">
              <div className="text-2xl mb-2">📈</div>
              <p className="font-medium">Hover Scale</p>
              <p className="text-sm text-muted-foreground">hover-scale</p>
            </Card>
            <Card className="hover-glow p-4 text-center">
              <div className="text-2xl mb-2">✨</div>
              <p className="font-medium">Hover Glow</p>
              <p className="text-sm text-muted-foreground">hover-glow</p>
            </Card>
            <Card className="interactive-card p-4 text-center">
              <div className="text-2xl mb-2">🎯</div>
              <p className="font-medium">Interactive</p>
              <p className="text-sm text-muted-foreground">interactive-card</p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
