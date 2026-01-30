import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ... Type definition for NavItem ...
type NavItem = {
  to: string;
  labelKey: string; // Changed from label to labelKey
  icon: React.ElementType;
  color: string;
};

// ... navItems ...
const navItems: NavItem[] = [
  { to: '/app/discover', labelKey: 'nav.home', icon: Home, color: 'text-purple-400' },
  { to: '/app/matches', labelKey: 'nav.matchLobby', icon: Swords, color: 'text-blue-400' },
  { to: '/app/leaderboard', labelKey: 'nav.leaderboards', icon: Trophy, color: 'text-yellow-400' },
  { to: '/app/insights', labelKey: 'nav.gameInsights', icon: Brain, color: 'text-pink-500' },
];

// ... FloatingParticles ...

function NavLinks({ onNavigate, isMobile = false }: { onNavigate?: () => void; isMobile?: boolean }) {
  const location = useLocation();
  const { t } = useLanguage();

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
              'flex items-center gap-2 text-sm font-medium transition-colors relative group whitespace-nowrap',
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
              {t(item.labelKey as any)} {/* Use translation */}
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

// ... NavLinksAdminExtension ...

function AppLayout() {
  const { user, signOut, isLoading } = useAuthContext();
  const { language, setLanguage, availableLanguages } = useLanguage(); // Use Language Context
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // ... useEffect ...

  // ... if isLoading ...
  // ... if !user ...

  // ... profile ...

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ... Background ... */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <FloatingParticles />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/10 h-16">
        <div className="h-full px-4 mx-auto max-w-7xl flex items-center justify-between">

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
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="hidden md:flex items-center gap-1 text-gray-400 text-xs font-medium cursor-pointer hover:text-white transition-colors">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="uppercase">{language}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-white/10 text-white">
                {Object.entries(availableLanguages).map(([code, name]) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLanguage(code as any)}
                    className={cn("cursor-pointer focus:bg-white/10 focus:text-white", language === code && "bg-white/10 text-accent")}
                  >
                    <span className="mr-2 uppercase text-xs font-bold w-6">{code}</span>
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
