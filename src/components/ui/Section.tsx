import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  id?: string;
  variant?: 'default' | 'highlight' | 'transparent';
}

export function Section({
  children,
  title,
  subtitle,
  className = '',
  id,
  variant = 'default',
}: SectionProps) {
  const variants = {
    default: 'bg-white/5 backdrop-blur-sm border border-white/10',
    highlight: 'bg-gradient-to-br from-purple-900/30 to-pink-900/20 backdrop-blur-sm border border-white/10',
    transparent: 'bg-transparent',
  };

  return (
    <section 
      id={id}
      className={`py-16 md:py-24 relative overflow-hidden ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {(title || subtitle) && (
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {subtitle && (
              <div className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4">
                <span className="text-sm font-medium text-pink-400">{subtitle}</span>
              </div>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                {title}
              </h2>
            )}
          </motion.div>
        )}
        <div className={variants[variant]}>
          {children}
        </div>
      </div>
    </section>
  );
}
