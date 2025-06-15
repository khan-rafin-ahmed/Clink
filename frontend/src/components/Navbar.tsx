import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { User, LogOut, Settings, Edit, Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/userService'
import { NotificationBell } from './NotificationBell'
import { CommandMenu, CommandMenuTrigger, useCommandMenu } from './CommandMenu'
import type { UserProfile } from '@/types'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const commandMenu = useCommandMenu()

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(setUserProfile).catch(() => {
        // Silently handle profile loading errors
      })
    }
  }, [user])

  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'User'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 glass-nav border-b border-white/10 nav-float">
      {/* Enhanced glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/thirstee-logo.svg"
              alt="Thirstee"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Command Menu Search */}
            <div className="w-64 slide-in-left">
              <CommandMenuTrigger onOpen={() => commandMenu.setOpen(true)} />
            </div>

            <Link
              to="/discover"
              className="text-muted-foreground hover:text-accent-primary font-medium px-3 py-2 rounded-lg hover:bg-white/5 glass-effect"
            >
              Discover
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <div>
                  <NotificationBell />
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2 glass-effect hover:bg-white/10">
                      <Avatar className="w-8 h-8 ring-2 ring-white/20 hover:ring-primary/40">
                        <AvatarImage src={userProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm backdrop-blur-sm">
                          {avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium">
                        {displayName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-modal border-white/20 backdrop-blur-xl">
                    <DropdownMenuLabel className="glass-effect rounded-lg p-3 mb-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-shadow">
                          {displayName} 🍻
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-primary font-medium pulse-glow">
                          Ready to raise some hell?
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem asChild className="hover:bg-white/10">
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-white/10">
                      <Link to="/profile/edit" className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem disabled className="opacity-50">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={signOut}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3 slide-in-right">
                <Link to="/login">
                  <Button
                    variant="glass"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Log in
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="glass-primary"
                    size="sm"
                    className=""
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Notification Bell */}
            {user && (
              <div>
                <NotificationBell />
              </div>
            )}

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full bg-black/80 border-none p-0 z-40"
              >
                {/* Fixed Header with Logo and Close */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-[rgba(8,9,10,0.95)] border-b border-white/8">
                  <div className="flex items-center justify-between px-4 h-16">
                    <Link to="/" className="flex items-center">
                      <img
                        src="/thirstee-logo.svg"
                        alt="Thirstee"
                        className="h-8 w-auto"
                      />
                    </Link>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Solid Dark Sidebar Panel */}
                <div className="pt-20 px-4">
                  <div className="max-w-[340px] mx-auto bg-[#0E0E10] border border-white/8 rounded-2xl px-6 py-6">
                    {/* Profile Block - Avatar + Name Only */}
                    {user && (
                      <div className="bg-white/5 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 ring-2 ring-white/20">
                            <AvatarImage src={userProfile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-white/10 text-white">
                              {avatarFallback}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-base truncate">
                              {displayName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="flex flex-col h-full min-h-[400px]">
                      <div className="space-y-3 flex-1">
                        {/* Discover */}
                        <Link
                          to="/discover"
                          className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center gap-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Search className="w-5 h-5 text-gray-400" />
                          <span>Discover</span>
                        </Link>

                        {user ? (
                          <>
                            {/* My Profile */}
                            <Link
                              to="/profile"
                              className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center gap-3"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <User className="w-5 h-5 text-gray-400" />
                              <span>My Profile</span>
                            </Link>

                            {/* Edit Profile */}
                            <Link
                              to="/profile/edit"
                              className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center gap-3"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Edit className="w-5 h-5 text-gray-400" />
                              <span>Edit Profile</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            {/* Welcome Message for Non-Authenticated Users */}
                            <div className="text-center mb-6 bg-white/5 p-4 rounded-xl">
                              <h3 className="text-lg font-bold text-white mb-2">
                                Ready to raise some hell? 🍻
                              </h3>
                              <p className="text-sm text-gray-300 font-medium">
                                Join Thirstee and discover epic drinking events near you
                              </p>
                            </div>

                            {/* Auth Actions */}
                            <div className="space-y-3">
                              <Link
                                to="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full px-4 py-3 rounded-lg bg-white text-black font-bold transition-colors hover:bg-gray-100 text-center block"
                              >
                                Log in
                              </Link>

                              <Link
                                to="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors text-center block"
                              >
                                Sign up free
                              </Link>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Sign Out Button - Bottom of Sidebar */}
                      {user && (
                        <div className="pt-4 border-t border-white/10">
                          <button
                            onClick={() => {
                              signOut()
                              setIsMobileMenuOpen(false)
                            }}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-red-500/10 text-red-300 hover:text-red-500 font-medium transition-colors flex items-center gap-3"
                          >
                            <LogOut className="w-5 h-5 text-red-300" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Command Menu */}
      <CommandMenu
        open={commandMenu.open}
        onOpenChange={commandMenu.setOpen}
      />
    </nav>
  )
}