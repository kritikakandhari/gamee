import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Swords, Trophy, Menu, X, Wallet, Brain, ShieldAlert, Bell, Globe, User, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth as useAuthContext } from '@/auth/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type NavItem = {
    to: string;
    labelKey: string;
    icon: React.ElementType;
    color: string;
};

const navItems: NavItem[] = [
    { to: '/app/discover', labelKey: 'nav.home', icon: Home, color: 'text-primary' },
    { to: '/app/matches', labelKey: 'nav.matchLobby', icon: Swords, color: 'text-secondary' },
    { to: '/app/leaderboard', labelKey: 'nav.leaderboards', icon: Trophy, color: 'text-accent' },
    { to: '/app/insights', labelKey: 'nav.gameInsights', icon: Brain, color: 'text-primary' },
];

function NavLinks({ onNavigate, isMobile = false }: { onNavigate?: () => void; isMobile?: boolean }) {
    const location = useLocation();
    const { t } = useLanguage();
    const { user } = useAuthContext();
    const navigate = useNavigate();

    const handleNavClick = (e: React.MouseEvent, to: string) => {
        if (!user) {
            e.preventDefault();
            navigate('/login', { state: { from: to } });
            if (onNavigate) onNavigate();
            return;
        }
        if (onNavigate) onNavigate();
    };

    return (
        <nav className={isMobile ? "space-y-1 w-full" : "flex items-center space-x-6"}>
            {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                const Icon = item.icon;

                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={(e) => handleNavClick(e, item.to)}
                        className={cn(
                            'flex items-center gap-2 text-sm font-medium transition-colors relative group whitespace-nowrap',
                            isActive
                                ? 'text-secondary font-bold'
                                : 'text-gray-400 hover:text-primary',
                            isMobile ? 'w-full px-4 py-3 rounded-lg hover:bg-white/5' : ''
                        )}
                    >
                        <Icon className={cn('h-4 w-4 transition-transform duration-300 group-hover:scale-110', isActive ? 'text-secondary' : 'text-gray-400 group-hover:text-primary')} />
                        <span className={cn(
                            isActive ? 'text-secondary' : 'text-gray-400 group-hover:text-primary'
                        )}>
                            {t(item.labelKey as any)}
                        </span>
                        {isActive && !isMobile && (
                            <motion.span
                                className="absolute -bottom-6 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
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

export function Navbar() {
    const { user, signOut } = useAuthContext();
    const { language, setLanguage, availableLanguages, t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const profile = user ? {
        username: (user.user_metadata?.username || user.email?.split('@')[0] || 'User') as string,
        display_name: (user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0] || 'User') as string,
        avatar_url: (user.user_metadata?.avatar_url || user.user_metadata?.picture) as string | undefined,
    } : null;

    // Mock Notifications
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Welcome!', message: 'Welcome to FGC Money Match.', read: false, time: '2m ago' },
        { id: 2, title: 'Match Ready', message: 'Your match against Player2 is ready.', read: false, time: '1h ago' },
        { id: 3, title: 'System Update', message: 'The platform has been updated.', read: true, time: '1d ago' },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = (id: number) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/10 h-16">
            <div className="h-full px-4 mx-auto max-w-7xl flex items-center justify-between">

                {/* Left: Logo */}
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(user ? '/app/discover' : '/')}>
                    <img
                        src="/images/logo.png"
                        alt="FGC Money Match"
                        className="h-10 md:h-12 w-auto object-contain transition-transform hover:scale-105"
                    />
                </div>

                {/* Center: Navigation - Visible to guests but guarded */}
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

                    {/* Wallet Balance Display (Only if logged in) */}
                    {user && (
                        <div
                            className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full cursor-pointer border border-white/5 transition-colors"
                            onClick={() => navigate('/app/wallet')}
                        >
                            <Wallet className="h-3.5 w-3.5 text-secondary" />
                            <span className="text-sm font-medium text-secondary">$125.50</span>
                        </div>
                    )}

                    {/* Notification Bell (Only if logged in) */}
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="relative cursor-pointer text-gray-400 hover:text-white transition-colors">
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 bg-gray-900 border-white/10 text-white p-0">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="font-semibold">{t('app.notifications.title')}</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-secondary hover:text-secondary/80 font-medium transition-colors"
                                        >
                                            {t('app.notifications.markAllRead')}
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[300px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            {t('app.notifications.empty')}
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <DropdownMenuItem
                                                key={notification.id}
                                                className={`p-4 border-b border-white/5 last:border-0 cursor-pointer focus:bg-white/5 ${!notification.read ? 'bg-white/5' : ''}`}
                                                onClick={() => handleMarkAsRead(notification.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.read ? 'bg-secondary' : 'bg-transparent'}`} />
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                                                        <p className="text-xs text-gray-400 line-clamp-2">{notification.message}</p>
                                                        <p className="text-[10px] text-gray-500">{notification.time}</p>
                                                    </div>
                                                </div>
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* User Profile Dropdown */}
                    {user && profile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex items-center rounded-full focus:outline-none ring-2 ring-transparent hover:ring-purple-500/50 transition-all transition-transform active:scale-95"
                                >
                                    <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarImage src={profile.avatar_url} alt={profile.display_name || profile.username} />
                                        <AvatarFallback className="bg-purple-600 text-xs text-white">
                                            {(profile.display_name || profile.username).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-gray-900/95 backdrop-blur-md border-white/10 text-white">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile.display_name || profile.username}</p>
                                        <p className="text-xs leading-none text-gray-400">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                    onClick={() => navigate('/app/profile')}
                                    className="hover:bg-white/5 cursor-pointer flex items-center gap-2"
                                >
                                    <User className="h-4 w-4 text-purple-400" />
                                    <span>{t('nav.profile')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem
                                    onClick={() => signOut()}
                                    className="hover:bg-red-500/10 text-red-400 cursor-pointer flex items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>{t('nav.signOut')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                {t('nav.signIn')}
                            </button>
                            <button onClick={() => navigate('/register')} className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-full transition-all">
                                {t('nav.join')}
                            </button>
                        </div>
                    )}

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

                    {/* Guest Mobile Links */}
                    {!user && (
                        <>
                            <button onClick={() => navigate('/login')} className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">
                                {t('nav.signIn')}
                            </button>
                            <button onClick={() => navigate('/register')} className="block w-full text-left px-4 py-3 text-sm font-bold text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-lg">
                                {t('nav.join')}
                            </button>
                        </>
                    )}


                    {/* Mobile Wallet Item */}
                    {user && (
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
                    )}

                    {user && (
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <button
                                onClick={async () => {
                                    await signOut();
                                    navigate('/login');
                                }}
                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                                {t('nav.signOut')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav >
    );
}
