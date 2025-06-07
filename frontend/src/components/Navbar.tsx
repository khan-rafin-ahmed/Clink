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
import { User, LogOut, Settings, Edit, Menu } from 'lucide-react'
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
      getUserProfile(user.id).then(setUserProfile).catch(console.error)
    }
  }, [user])

  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'User'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
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
            {/* Command Menu Search */}
            <div className="w-64">
              <CommandMenuTrigger onOpen={() => commandMenu.setOpen(true)} />
            </div>

            <Link
              to="/discover"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Discover
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userProfile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium">
                        {displayName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Welcome back! 🍻
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-primary font-medium">
                          Ready to raise some hell?
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/edit" className="flex items-center">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Profile</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Log in
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <img
                      src="/thirstee-logo.svg"
                      alt="Thirstee"
                      className="h-8 w-auto"
                    />
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col space-y-4 mt-8">
                  {/* Navigation Links */}
                  <Link
                    to="/discover"
                    className="text-foreground hover:text-primary transition-colors font-medium py-2 px-3 rounded-lg hover:bg-muted"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Discover
                  </Link>

                  {user ? (
                    <>
                      {/* Notifications */}
                      <div className="flex justify-center py-2">
                        <NotificationBell />
                      </div>

                      {/* User Section */}
                      <div className="border-t border-border pt-4 mt-4">
                        <div className="flex items-center space-x-3 mb-4 p-3 bg-muted/50 rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={userProfile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {avatarFallback}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>

                        {/* User Menu Items */}
                        <div className="space-y-2">
                          <Link
                            to="/profile"
                            className="flex items-center space-x-3 text-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                          </Link>

                          <Link
                            to="/profile/edit"
                            className="flex items-center space-x-3 text-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-muted"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit Profile</span>
                          </Link>

                          <button
                            disabled
                            className="flex items-center space-x-3 text-muted-foreground py-2 px-3 rounded-lg w-full text-left opacity-50"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </button>

                          <button
                            onClick={() => {
                              signOut()
                              setIsMobileMenuOpen(false)
                            }}
                            className="flex items-center space-x-3 text-destructive hover:text-destructive/80 transition-colors py-2 px-3 rounded-lg hover:bg-destructive/10 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Auth Buttons */}
                      <div className="border-t border-border pt-4 mt-4 space-y-3">
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-foreground"
                          >
                            Log in
                          </Button>
                        </Link>
                        <Link
                          to="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Button
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            Sign up
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
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