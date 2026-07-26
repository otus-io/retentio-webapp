'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Users, Brain, Palette, Bot, ArrowRight, Clock, BookOpen, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'
import { AppButtonLink } from '@/components/app/AppButtonLink'
import { PLAY_STORE_URL, TESTFLIGHT_JOIN_URL } from '@/config'

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.609 1.814 13.792 12 3.61 22.186a1.985 1.985 0 0 1-.638-1.47V3.284c0-.565.24-1.083.637-1.47zm1.858-.75 11.286 6.447-3.944 3.944L3.61 2.922l1.857-1.858zm12.143 6.94 2.71 1.547c.85.486.85 1.702 0 2.188l-2.71 1.547-4.145-4.141 4.145-4.141zM4.61 21.078l8.096-8.096 3.944 3.944L5.467 23.373 4.61 21.078z" />
    </svg>
  )
}

function AnimatedSection({ children, className, delay = 0 }: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '-80px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={clsx(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
        className,
      )}
    >
      {children}
    </div>
  )
}

const features = [
  { icon: Users, key: 'community' },
  { icon: Brain, key: 'algorithm' },
  { icon: Palette, key: 'ui' },
  { icon: Bot, key: 'ai' },
] as const

const steps = [
  { icon: Clock, key: 'step1', gradient: 'from-indigo-100 to-indigo-200 dark:from-indigo-950 dark:to-indigo-900' },
  { icon: BookOpen, key: 'step2', gradient: 'from-emerald-100 to-emerald-200 dark:from-emerald-950 dark:to-emerald-900' },
  { icon: TrendingUp, key: 'step3', gradient: 'from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900' },
] as const

export default function HomePage() {
  const t = useTranslations()

  return (
    <div>
      {/* Hero Section */}
      <section className="flex items-center relative overflow-hidden  bg-linear-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900  px-6 md:px-12">
        <div className="absolute -top-48 -right-48  rounded-full bg-blue-500/10 dark:bg-blue-400/5 blur-3xl" />
        <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full bg-purple-500/8 dark:bg-purple-400/5 blur-3xl" />
        <div className="relative max-w-content mx-auto z-10 w-full grid grid-cols-1 gap-10 items-center py-16">
          <div className="animate-[fade-in-left_0.8s_ease-out_both]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 text-center">
              {t('home.hero.title')}
              <span className="text-accent block">{t('home.hero.titleHighlight')}</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed animate-[fade-in_0.6s_0.3s_ease-out_both] text-center">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex gap-2 flex-wrap animate-[fade-in-up_0.5s_0.5s_ease-out_both] items-center justify-center">
              <AppButtonLink
                href="/guide/background/what-is-retentio"
                variant="outline"
                size="lg"
              >
                {t('home.hero.learnMore')}
                <ArrowRight className="size-4" />
              </AppButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-10 md:py-12">
        <div className="text-center max-w-2xl mx-auto px-4 md:px-2">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.cta.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-row flex-nowrap items-center justify-center gap-3">
            <a
              href={TESTFLIGHT_JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-8 py-3.5 rounded-xl bg-accent text-white font-medium text-base sm:text-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <AppleIcon className="size-5 shrink-0" />
              {t('home.cta.button')}
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 sm:px-8 py-3.5 rounded-xl bg-accent text-white font-medium text-base sm:text-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <GooglePlayIcon className="size-5 shrink-0" />
              {t('home.cta.androidButton')}
            </a>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {t('home.cta.note')}
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 max-w-content px-4 md:px-2 mx-auto">
        <AnimatedSection className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 ">{t('home.about.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
            {t('home.about.description')}
          </p>
        </AnimatedSection>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 max-w-content px-4 md:px-2 mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t('home.features.sectionTitle')}</h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.key} delay={i * 150}>
              <div className="h-full text-center p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 rounded-xl bg-accent text-white flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="size-7" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`home.features.${feature.key}.title` as 'home.features.community.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(`home.features.${feature.key}.description` as 'home.features.community.description')}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 max-w-content px-4 md:px-2 mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t('home.howItWorks.sectionTitle')}</h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <AnimatedSection key={step.key} delay={i * 150}>
              <div className="text-center">
                <div className={clsx('w-full aspect-video rounded-2xl mb-4 flex items-center justify-center bg-linear-to-br', step.gradient)}>
                  <step.icon className="size-12 opacity-60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t(`home.howItWorks.${step.key}.title` as 'home.howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                  {t(`home.howItWorks.${step.key}.description` as 'home.howItWorks.step1.description')}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
        <AnimatedSection className="text-center mt-10">
          <AppLink
            href="/guide/background/read-more"
            className="inline-flex items-center gap-1 font-semibold hover:gap-2 transition-all"
          >
            {t('home.howItWorks.readMore')}
            <ArrowRight className="size-4" />
          </AppLink>
        </AnimatedSection>
      </section>
    </div>
  )
}
