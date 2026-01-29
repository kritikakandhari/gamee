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
    </div>
  );
}
