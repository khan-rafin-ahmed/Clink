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

  // Helper function to get drink emoji for display names (returns empty if no drink)
  const getDrinkEmojiForDisplay = (drink: string | null | undefined): string => {
    if (!drink || drink === 'none') {
      return '' // Return empty string for display names when no drink is set
    }

    const drinkMap: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      cocktails: '🍸',
      whiskey: '🥃',
      vodka: '🍸',
      rum: '🍹',
      gin: '🍸',
      tequila: '🥃',
      champagne: '🥂',
      sake: '🍶',
      other: '🍻'
    }

    return drinkMap[drink.toLowerCase()] || '🍻'
  }

  const emoji = getDrinkEmojiForDisplay(userProfile?.favorite_drink)
  const displayNameWithDrink = emoji ? `${displayName} ${emoji}` : displayName
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
                          {displayNameWithDrink}
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
              <PopoverContent className="max-w-[320px] p-0 bg-[#0E0E10]/90 backdrop-blur-md border-white/8 rounded-2xl shadow-xl" align="end">
                <div className="px-3 py-2">
                  {/* Profile Block - Avatar + Name Only */}
                  {user && (
                    <div className="bg-white/5 rounded-lg px-3 py-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-10 h-10 ring-2 ring-white/20">
                          <AvatarImage src={userProfile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-white/10 text-white text-sm">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">
                            {displayName}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {/* Discover */}
                    <Link
                      to="/discover"
                      className="w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors flex items-center gap-3"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Search className="w-4 h-4 text-[#888888]" />
                      <span className="text-sm">Discover</span>
                    </Link>

                    {user ? (
                      <>
                        {/* My Profile */}
                        <Link
                          to="/profile"
                          className="w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors flex items-center gap-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="w-4 h-4 text-[#888888]" />
                          <span className="text-sm">My Profile</span>
                        </Link>

                        {/* Edit Profile */}
                        <Link
                          to="/profile/edit"
                          className="w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors flex items-center gap-3"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Edit className="w-4 h-4 text-[#888888]" />
                          <span className="text-sm">Edit Profile</span>
                        </Link>

                        {/* Visual Separator */}
                        <div className="border-t border-white/10 my-1"></div>

                        {/* Sign Out Button */}
                        <button
                          onClick={() => {
                            signOut()
                            setIsMobileMenuOpen(false)
                          }}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-red-500/10 text-red-300 hover:text-red-500 font-medium transition-colors flex items-center gap-3"
                        >
                          <LogOut className="w-4 h-4 text-red-300" />
                          <span className="text-sm">Sign out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Auth Actions */}
                        <div className="space-y-1">
                          <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full px-3 py-2.5 rounded-lg bg-white text-black font-bold transition-colors hover:bg-gray-100 text-center block text-sm"
                          >
                            Log in
                          </Link>

                          <Link
                            to="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/8 text-white font-medium transition-colors text-center block text-sm"
                          >
                            Sign Up
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

    </nav>
  )
}