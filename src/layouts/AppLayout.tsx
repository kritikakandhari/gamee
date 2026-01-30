import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
// import { LegalFooter } from '@/components/layout/LegalFooter'; // Kept imports
import { Home, Swords, Trophy, Menu, X, Wallet, Brain, ShieldAlert, Bell, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import { useAuth as useAuthContext } from '@/auth/AuthProvider';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button'; // Added Button import

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  color: string;
};


const navItems: NavItem[] = [
  { to: '/app/discover', label: 'Home', icon: Home, color: 'text-purple-400' },
  { to: '/app/matches', label: 'Match Lobby', icon: Swords, color: 'text-blue-400' },
  { to: '/app/leaderboard', label: 'Leaderboards', icon: Trophy, color: 'text-yellow-400' },
  { to: '/app/insights', label: 'Game Insights', icon: Brain, color: 'text-pink-500' },
  { to: '/app/wallet', label: 'Wallet', icon: Wallet, color: 'text-green-400' },
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
    <nav className={isMobile ? "space-y-1 w-full" : "flex items-center space-x-6"}>
      {navItems.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors relative group',
              isActive
                ? 'text-accent'
                : 'text-gray-400 hover:text-white',
              isMobile ? 'w-full px-4 py-3 rounded-lg hover:bg-white/5' : ''
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-gray-400 group-hover:text-white')} />
            <span className={cn(
              isActive ? 'text-accent' : 'text-gray-400 group-hover:text-white'
            )}>
              {item.label}
            </span>
            {isActive && !isMobile && (
              <motion.span
                className="absolute -bottom-6 left-0 right-0 h-0.5 bg-accent rounded-full"
                layoutId="nav-underline"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </NavLink>
        );
      })}

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
        'flex items-center gap-2 text-sm font-medium transition-colors',
        isActive
          ? 'text-red-400'
          : 'text-gray-400 hover:text-red-400',
        isMobile ? 'w-full px-4 py-3 rounded-lg hover:bg-white/5' : ''
      )}
    >
      <ShieldAlert className={cn('h-4 w-4', isActive ? 'text-red-400' : 'text-gray-400 hover:text-red-400')} />
      <span className={cn(
        isActive ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
      )}>
        Admin
      </span>
    </NavLink>
  )
}


function AppLayout() {
  const { user, signOut, isLoading } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
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
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/10 h-16">
        <div className="h-full px-4 mx-auto max-w-7xl flex items-center justify-between">

          {/* Left: Logo */}
          {/* Left: Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/app/discover')}>
            <img
              src="/images/logo.png"
              alt="FGC Money Match"
              className="h-10 md:h-12 w-auto object-contain transition-transform hover:scale-105"
            />
          </div>

          {/* Center: Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavLinks />
          </div>

          {/* Right: User Controls */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Language (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1 text-gray-400 text-xs font-medium cursor-pointer hover:text-white">
              <Globe className="h-3.5 w-3.5" />
              <span>EN</span>
            </div>

            {/* Wallet Balance Display */}
            <div
              className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full cursor-pointer border border-white/5 transition-colors"
              onClick={() => navigate('/app/wallet')}
            >
              <Wallet className="h-3.5 w-3.5 text-green-400" />
              <span className="text-sm font-medium text-green-400">$125.50</span>
            </div>

            {/* Notification Bell */}
            <div className="relative cursor-pointer text-gray-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-purple-500 rounded-full border-2 border-background"></span>
            </div>

            {/* User Avatar */}
            <div className="relative">
              <button
                onClick={() => navigate('/app/profile')}
                className="flex items-center rounded-full focus:outline-none ring-2 ring-transparent hover:ring-purple-500/50 transition-all"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                  <AvatarFallback className="bg-purple-600 text-xs">
                    {(profile.display_name || profile.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -mr-2 text-gray-400 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-background/95 backdrop-blur-xl border-b border-white/10 fixed left-0 right-0 top-16`}>
          <div className="px-4 py-4 space-y-2">
            <NavLinks isMobile onNavigate={() => setIsMobileMenuOpen(false)} />

            {/* Mobile Wallet Item */}
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-green-400 bg-white/5 hover:bg-white/10"
              onClick={() => {
                navigate('/app/wallet');
                setIsMobileMenuOpen(false);
              }}
            >
              <Wallet className="h-4 w-4" />
              <span>Wallet: $125.50</span>
            </div>

            <div className="pt-4 mt-4 border-t border-white/5">
              <button
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                Sign out
              </button>
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-[calc(100vh-5rem)]"
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
