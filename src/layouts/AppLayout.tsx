import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LegalFooter } from '@/components/layout/LegalFooter';
import { Home, Swords, Trophy, User, LogOut, Menu, X, Wallet, ChevronDown, Brain, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import { useAuth as useAuthContext } from '@/auth/AuthProvider';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  color: string;
};


const navItems: NavItem[] = [
  { to: '/app/discover', label: 'Discover', icon: Home, color: 'text-purple-400' },
  { to: '/app/matches', label: 'Matches', icon: Swords, color: 'text-blue-400' },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-yellow-400' },
  { to: '/app/insights', label: 'Game Insights', icon: Brain, color: 'text-pink-500' },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet, color: 'text-green-400' }, // Added Wallet item
  { to: '/app/profile', label: 'Profile', icon: User, color: 'text-pink-400' },
];

const FloatingParticles = () => {
  const [particles] = useState(() =>
    Array(20).fill(0).map(() => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 5,
      color: Math.random() > 0.7 ? '#8B5CF6' : '#4F46E5',
      opacity: Math.random() * 0.1 + 0.05
    }))
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            opacity: particle.opacity
          }}
          animate={{
            y: [0, 50, 0],
            opacity: [particle.opacity, particle.opacity * 2, particle.opacity],
          }}
          transition={{
            duration: 5 + particle.speed * 10,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

function NavLinks({ onNavigate, isMobile = false }: { onNavigate?: () => void; isMobile?: boolean }) {
  const location = useLocation();

  return (
    <nav className={isMobile ? "space-y-1 w-full" : "flex items-center space-x-1"}>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-white/5',
              isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-white',
              isMobile ? 'w-full' : 'flex-col py-1.5 px-3'
            )}
          >
            <div className={cn(
              'p-1.5 rounded-lg',
              isActive ? 'bg-white/10' : 'bg-transparent'
            )}>
              <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-gray-400')} />
            </div>
            <span className={cn(
              'text-xs mt-1',
              isActive ? 'text-white' : 'text-gray-400'
            )}>
              {item.label}
            </span>
            {isActive && !isMobile && (
              <motion.span
                className="absolute -bottom-1 left-1/2 h-0.5 bg-purple-500 w-4 -translate-x-1/2 rounded-full"
                layoutId="nav-underline"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </NavLink>
        );
      })}

      {/* Admin Link - Conditional */}
      {/* Accessing user/isAdmin from parent usually, but here we can't easily.
          Wait, NavLinks is a child component. We should pass isAdmin prop or useHook.
          But NavLinks does not have useAuth calls inside it.
          Let's rewrite NavLinks to use useAuthContext.
      */}
      <NavLinksAdminExtension isMobile={isMobile} onNavigate={onNavigate} />
    </nav>
  );
}

// Separate component to hook into auth context without prop drilling too much if I don't want to change NavLinks signature extensively
function NavLinksAdminExtension({ isMobile, onNavigate }: { isMobile: boolean, onNavigate?: () => void }) {
  const { isAdmin } = useAuthContext();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/app/admin');

  if (!isAdmin) return null;

  return (
    <NavLink
      to="/app/admin"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
        'hover:bg-red-500/10',
        isActive
          ? 'text-red-400'
          : 'text-gray-400 hover:text-red-400',
        isMobile ? 'w-full' : 'flex-col py-1.5 px-3'
      )}
    >
      <div className={cn(
        'p-1.5 rounded-lg',
        isActive ? 'bg-red-500/10' : 'bg-transparent'
      )}>
        <ShieldAlert className={cn('h-5 w-5', isActive ? 'text-red-400' : 'text-gray-400 hover:text-red-400')} />
      </div>
      <span className={cn(
        'text-xs mt-1',
        isActive ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
      )}>
        Admin
      </span>
    </NavLink>
  )
}


function AppLayout() {
  const { user, signOut } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (!user) {
    return null;
  }

  // Derive profile from Supabase user metadata
  const profile = {
    username: (user.user_metadata?.username || user.email?.split('@')[0] || 'User') as string,
    display_name: (user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User') as string,
    avatar_url: (user.user_metadata?.avatar_url || user.user_metadata?.picture) as string | undefined,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Animated Background - simplified */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <FloatingParticles />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo with Uploaded Image */}
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/logo.png"
                    alt="FGC Money Match Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  FGC MONEY MATCH
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-center flex-1 px-4">
              <NavLinks />
            </div>

            {/* Right side - User menu */}
            <div className="flex items-center ml-4 md:ml-6">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/app/profile')}
                    className="flex items-center max-w-xs text-sm rounded-full focus:outline-none"
                  >
                    <Avatar className="h-8 w-8 border-2 border-purple-500/30">
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                      <AvatarFallback className="bg-purple-600 text-xs">
                        {(profile.display_name || profile.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-2 mr-1 text-sm font-medium text-gray-300 md:block hidden">
                      {profile.display_name || profile.username}
                    </span>
                    <ChevronDown className="hidden md:block w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center ml-3 md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-gray-900/95 backdrop-blur-sm`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLinks isMobile onNavigate={() => setIsMobileMenuOpen(false)} />
            <div className="pt-4 pb-3 border-t border-white/5">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                    <AvatarFallback className="bg-purple-600">
                      {(profile.display_name || profile.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{profile.display_name || profile.username}</div>
                  <div className="text-sm font-medium text-gray-400">View Profile</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                  className="block w-full px-3 py-2 text-base font-medium text-red-400 rounded-md hover:bg-red-500/10"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        <div className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/50 backdrop-blur-lg p-4 md:p-6 border border-white/5 shadow-2xl shadow-black/30 min-h-[calc(100vh-8rem)]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export { AppLayout };
