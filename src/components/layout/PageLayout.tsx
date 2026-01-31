import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  backgroundPattern?: 'grid' | 'dots' | 'none';
}

export function PageLayout({
  children,
  className = '',
  gradientFrom = 'from-gray-900',
  gradientTo = 'to-violet-900',
  backgroundPattern = 'grid',
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} via-purple-900 ${gradientTo} text-white overflow-x-hidden ${className}`}>
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent"></div>
        {backgroundPattern === 'grid' && (
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black_70%)]" />
        )}
        {backgroundPattern === 'dots' && (
          <div className="absolute inset-0 bg-dot-white/[0.05] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        )}
      </div>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {children}
      </motion.main>

      {/* Floating Guide Button */}
      <button
        className="fixed bottom-6 right-6 z-50 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-lg shadow-purple-500/20 transition-all hover:scale-110 active:scale-95 group"
        onClick={() => {
          // Placeholder for guide/help modal
          alert("Opening Money Match Guide & Support...");
        }}
      >
        <HelpCircle className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 border border-white/10 rounded text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Open Guide
        </span>
      </button>
    </div>
  );
}

const HelpCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
