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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, LogOut, Settings, Edit, Menu, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUserProfile } from '@/lib/userService'
import { NotificationBell } from './NotificationBell'
import type { UserProfile } from '@/types'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            <Link
              to="/discover"
              className="text-muted-foreground hover:text-accent-primary font-medium px-4 py-1.5 rounded-full hover:bg-white/5 glass-effect flex items-center gap-2"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-accent-primary font-medium px-4 py-1.5 rounded-full hover:bg-white/5 glass-effect flex items-center gap-2"
                    >
                      <Avatar className="w-6 h-6 rounded-full object-cover">
                        <AvatarImage src={userProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
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

            <Popover open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-w-[340px] p-0 bg-[#0E0E10]/90 backdrop-blur-md border-white/8 rounded-2xl shadow-xl" align="end">
                <ScrollArea className="max-h-[80vh]">
                  <div className="px-4 py-4">
                  {/* Profile Block - Avatar + Name Only */}
                  {user && (
                    <div className="bg-white/5 rounded-xl px-4 py-4 mb-4">
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
                  <div className="space-y-4">
                    {/* Discover */}
                    <Link
                      to="/discover"
                      className="w-full px-4 py-4 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors flex items-center gap-3"
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
                          className="w-full px-4 py-4 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors flex items-center gap-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="w-5 h-5 text-gray-400" />
                          <span>My Profile</span>
                        </Link>

                        {/* Edit Profile */}
                        <Link
                          to="/profile/edit"
                          className="w-full px-4 py-4 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors flex items-center gap-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Edit className="w-5 h-5 text-gray-400" />
                          <span>Edit Profile</span>
                        </Link>

                        {/* Sign Out Button */}
                        <div className="pt-4 border-t border-white/10">
                          <button
                            onClick={() => {
                              signOut()
                              setIsMobileMenuOpen(false)
                            }}
                            className="w-full px-4 py-4 rounded-lg bg-white/5 hover:bg-red-500/10 text-red-300 hover:text-red-500 font-medium transition-colors flex items-center gap-3"
                          >
                            <LogOut className="w-5 h-5 text-red-300" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Auth Actions */}
                        <div className="space-y-4">
                          <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full px-4 py-4 rounded-lg bg-white text-black font-bold transition-colors hover:bg-gray-100 text-center block"
                          >
                            Log in
                          </Link>

                          <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full px-4 py-4 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors text-center block"
                          >
                            Sign Up
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

    </nav>
  )
}