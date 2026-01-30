import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Trophy,
  Swords,
  BarChart2,
  Users,
  Play,
  Sparkles,
  Award,
  Zap,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

// Color constants
// Color constants
const COLORS = {
  primary: '#22d3ee',      // Cyan (Money)
  primaryLight: '#67e8f9', // Lighter Cyan
  accent: '#fbbf24',       // Gold (Accent)
  accentDark: '#d97706',   // Darker Gold
  dark: '#0f172a',         // Dark Slate
  light: '#FFFFFF',        // White
  gray: '#9CA3AF',         // Gray for text
  darkGray: '#4B5563',     // Darker gray
  purple: '#a855f7',       // Logo Purple
  lightPurple: '#d8b4fe',  // Light Purple accents
  darkPurple: '#581c87',   // Dark purple
  gradient: 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)', // Cyan -> Purple (Logo)
  gradientAccent: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', // Gold
  gradientDark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  gradientGold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
};

const FloatingParticles = () => {
  const [particles] = useState(() =>
    Array(30).fill(0).map(() => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 5,
      color: Math.random() > 0.3 ? COLORS.primaryLight : COLORS.accent,
      opacity: Math.random() * 0.1 + 0.05
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
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

export default function LandingPage() {
  const { t } = useLanguage();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Trophy className="h-8 w-8" style={{ color: COLORS.accent }} />,
      title: t('landing.feature.matches.title'),
      description: t('landing.feature.matches.desc')
    },
    {
      icon: <BarChart2 className="h-8 w-8" style={{ color: COLORS.accent }} />,
      title: t('landing.feature.tracking.title'),
      description: t('landing.feature.tracking.desc')
    },
    {
      icon: <Users className="h-8 w-8" style={{ color: COLORS.accent }} />,
      title: t('landing.feature.community.title'),
      description: t('landing.feature.community.desc')
    }
  ];

  const stats = [
    { value: "10,000+", label: t('landing.stats.players'), icon: <Users className="h-6 w-6" style={{ color: COLORS.accent }} /> },
    { value: "50,000+", label: t('landing.stats.matches'), icon: <Swords className="h-6 w-6" style={{ color: COLORS.accent }} /> },
    { value: "$1M+", label: t('landing.stats.prizes'), icon: <Award className="h-6 w-6" style={{ color: COLORS.accent }} /> },
    { value: "24/7", label: t('landing.stats.support'), icon: <Clock className="h-6 w-6" style={{ color: COLORS.accent }} /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-secondary/20 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 bg-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <FloatingParticles />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 md:pt-20">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,transparent,black_70%)]" />
        <div className="container relative z-10 mx-auto px-4 pt-4 pb-20 text-center sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 lg:pb-28">
          {/* Company Name with Fancy Animation */}
          <motion.div
            className="mb-8 sm:mb-10 md:mb-12 relative"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                duration: 0.8,
                ease: [0.2, 0.8, 0.2, 1]
              }
            }}
            whileHover={{
              scale: 1.03,
              transition: {
                duration: 0.3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
          >
            <div className="relative">
              {/* Main Text */}
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wider"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  textShadow: `0 0 10px ${COLORS.primary}80`,
                  letterSpacing: '2px',
                  WebkitTextStroke: '1px rgba(255, 255, 255, 0.3)'
                }}
              >
                <motion.span
                  className="relative z-10"
                  style={{
                    background: `linear-gradient(45deg, ${COLORS.light}, ${COLORS.primaryLight}, ${COLORS.primary}, ${COLORS.accent})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundSize: '300% 300%',
                    display: 'inline-block',
                    padding: '0 8px',
                  }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    textShadow: [
                      `0 0 10px ${COLORS.primary}80`,
                      `0 0 20px ${COLORS.primary}`,
                      `0 0 10px ${COLORS.primary}80`
                    ]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                    textShadow: {
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }
                  }}
                >
                  <span style={{ color: COLORS.light }}>FGC </span>
                  <span style={{ color: COLORS.primary }}>MONEY </span>
                  <span style={{ color: COLORS.purple }}>MATCH</span>
                </motion.span>
              </motion.h1>

              {/* Glow Effect */}
              <motion.div
                className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-secondary rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />

              {/* Animated Underline */}
              <motion.div
                className="absolute -bottom-2 left-1/2 h-1 w-0 bg-gradient-to-r from-transparent via-accent to-transparent"
                initial={{ width: 0, x: '-50%' }}
                animate={{
                  width: ['0%', '100%', '0%'],
                  left: ['50%', '50%', '100%']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: 'easeInOut',
                }}
              />
            </div>

            {/* Subtle Floating Effect */}
            <motion.div
              className="absolute -z-10 w-full h-8 bg-primary/20 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
          <motion.div
            className="inline-flex items-center gap-2 mb-8 px-6 py-2.5 rounded-full bg-gradient-to-r from-gray-900 to-gray-800 text-sm font-medium shadow-lg border border-primary/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ color: COLORS.accent }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span>Join the competitive gaming revolution</span>
            <ChevronRight className="h-4 w-4" />
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Join the Future of Competitive Gaming
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-secondary to-primary sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textShadow: `0 0 10px rgba(168, 85, 247, 0.4)` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t('landing.hero.titleStart')} <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-primary to-secondary">{t('landing.hero.titleEnd')}</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-300 sm:text-xl font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: COLORS.gray }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('landing.hero.subtitle')}
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ gap: '1rem' }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Button
                size="lg"
                className="group relative overflow-hidden px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                style={{
                  background: COLORS.gradient,
                  color: COLORS.dark,
                }}
                asChild
              >
                <Link to="/register" className="flex items-center">
                  {t('landing.cta.join')} <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-6 text-base font-medium border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 hover:text-white transition-all duration-300"
                asChild
              >
                <Link to="/about" className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-purple-400" />
                  {t('landing.cta.learnMore')}
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-16 mx-auto max-w-4xl bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-2xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-left">
                <h3 className="text-xl font-bold text-white mb-2">Featured Tournament</h3>
                <p className="text-gray-300 mb-4">Join the weekend showdown with $10,000 in prizes!</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-accent"><Zap className="h-4 w-4" /> 2,500+ Players</span>
                  <span className="h-1 w-1 rounded-full bg-white/30"></span>
                  <span className="text-primary-foreground">Starts in 2d 4h</span>
                </div>
              </div>
              <Button className="whitespace-nowrap bg-gradient-to-r from-accent to-yellow-500 text-gray-900 hover:from-accent hover:to-yellow-400">
                Register Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/10 to-transparent"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="group text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 100
                }}
                whileHover={{
                  y: -5,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-primary mb-4 text-white shadow-lg">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-white to-primary-foreground bg-clip-text text-transparent">{stat.value}</div>
                <div className="mt-2 text-sm text-gray-400 group-hover:text-white transition-colors">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Feature Showcase */}
      <section className="py-24 relative overflow-hidden" id="features">
        <div className="absolute -right-40 -top-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <motion.div
              className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-sm font-medium text-accent">Why Choose Us</span>
            </motion.div>
            <motion.h2
              className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t('landing.features.title')}
            </motion.h2>
            <motion.p
              className="mx-auto mt-4 max-w-2xl text-purple-100/80"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {t('landing.features.desc')}
            </motion.p>
          </div>

          <div className="relative mt-16">
            {/* Feature Showcase */}
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/20 to-primary/10 border border-white/10 backdrop-blur-sm">
              {/* Feature Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={features[currentFeature].title}
                  className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  <div className="max-w-md">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg mb-6">
                      {features[currentFeature].icon}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                      {features[currentFeature].title}
                    </h3>
                    <p className="text-gray-300 text-lg mb-8">
                      {features[currentFeature].description}
                    </p>
                    <Button
                      variant="outline"
                      className="border-white/20 bg-white/5 hover:bg-white/10 hover:text-white"
                    >
                      {t('landing.cta.learnMore')}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Feature Navigation Dots */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`w-3 h-3 rounded-full transition-all ${currentFeature === index
                      ? 'w-8 bg-gradient-to-r from-accent to-primary'
                      : 'bg-white/30 hover:bg-white/50'
                      }`}
                    aria-label={`Go to feature ${index + 1}`}
                  />
                ))}
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-500/10 to-transparent -z-10"></div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl"></div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`p-6 rounded-xl backdrop-blur-sm border ${currentFeature === index
                    ? 'bg-gradient-to-br from-secondary/20 to-primary/20 border-white/20 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                    } transition-all cursor-pointer`}
                  onClick={() => setCurrentFeature(index)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{
                    y: -5,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${index === 0 ? 'bg-accent/20 text-accent' :
                      index === 1 ? 'bg-primary/20 text-primary' :
                        'bg-secondary/20 text-secondary'
                      }`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-medium text-white">{feature.title}</h4>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 sm:py-24 overflow-hidden" style={{ backgroundColor: COLORS.dark }}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-secondary/20 to-transparent -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent/5 to-transparent -z-10"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-4xl text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/40 to-purple-900/20 text-sm font-medium border border-purple-700/30 backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ color: COLORS.accent }}
            >
              <Sparkles className="h-4 w-4" />
              <span>Why Choose FGC MONEY MATCH</span>
            </motion.div>

            <motion.h2
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                Premium Features for <span style={{ color: COLORS.accent }}>Competitive</span> Players
              </span>
            </motion.h2>

            <motion.p
              className="text-lg max-w-2xl mx-auto"
              style={{ color: COLORS.gray }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Experience the next generation of competitive gaming with features designed to help you win and earn.
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/5 border border-white/5 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{
                  y: -5,
                  boxShadow: `0 10px 25px -5px ${COLORS.primary}30`,
                  borderColor: `${COLORS.accent}40`
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.primary}30 0%, ${COLORS.primaryLight}30 100%)`,
                    border: `1px solid ${COLORS.accent}20`
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
                <div className="mt-4 flex items-center text-sm font-medium" style={{ color: COLORS.accent }}>
                  {t('landing.cta.learnMore')} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>

                {/* Decorative element */}
                <div
                  className="absolute -z-10 -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${COLORS.primaryLight}20 0%, transparent 70%)`
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center p-6 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/10 border border-white/5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
              >
                <div className="text-3xl font-bold mb-2" style={{ color: COLORS.accent }}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden" style={{ background: COLORS.gradient }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-full bg-black/5 -skew-x-12 -translate-x-1/2"></div>
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              className="inline-flex items-center gap-2 mb-6 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ color: COLORS.accent }}
            >
              <Zap className="h-5 w-5" />
              <span className="font-medium">{t('landing.cta.ready')}</span>
            </motion.div>

            <motion.h2
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {t('landing.cta.communityTitle')} <span style={{ color: COLORS.light }}>FGC </span> <span style={{ color: COLORS.primary }}>MONEY </span> <span style={{ color: COLORS.purple }}>MATCH</span> {t('landing.cta.communityTitleEnd')}
            </motion.h2>

            <motion.p
              className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {t('landing.cta.communityDesc')}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Button
                size="lg"
                className="px-8 h-14 text-base font-medium border border-white/20 hover:scale-105 transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  color: COLORS.light,
                }}
                asChild
              >
                <Link to="/register" className="flex items-center group">
                  {t('landing.cta.joinFree')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="px-8 h-14 text-base font-medium border-white/20 bg-black/20 hover:bg-black/40 hover:text-white transition-all duration-300"
                asChild
              >
                <Link to="/about" className="flex items-center">
                  {t('landing.cta.learnMore')}
                </Link>
              </Button>
            </motion.div>

            <motion.div
              className="mt-8 text-sm text-purple-100/70"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {t('landing.cta.disclaimer')}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
