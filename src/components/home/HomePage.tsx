'use client'

import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Languages, Brain, Palette, Bot, ArrowDown, ArrowRight, Clock, BookOpen, TrendingUp, Layers, Download } from 'lucide-react'
import clsx from 'clsx'
import AppLink from '@/components/app/AppLink'

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
  { icon: Languages, key: 'verified' },
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
  const t = useTranslations('home')

  return (
    <div>
      {/* Hero Section */}
      <section className="flex items-center relative overflow-hidden  bg-linear-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900  px-6 md:px-12">
        <div className="absolute -top-48 -right-48  rounded-full bg-blue-500/10 dark:bg-blue-400/5 blur-3xl" />
        <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full bg-purple-500/8 dark:bg-purple-400/5 blur-3xl" />

        <div className="relative max-w-content mx-auto z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-16">
          <div className="animate-[fade-in-left_0.8s_ease-out_both]">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              {t('hero.title')}
              <span className="text-accent block">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed animate-[fade-in_0.6s_0.3s_ease-out_both]">
              {t('hero.subtitle')}
            </p>
            <div className="flex gap-3 flex-wrap animate-[fade-in-up_0.5s_0.5s_ease-out_both]">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="size-5" />
                {t('hero.cta')}
              </a>
              <button
                type="button"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-accent text-accent font-medium hover:bg-accent/5 transition-colors cursor-pointer"
              >
                {t('hero.learnMore')}
                <ArrowDown className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center animate-[fade-in-right_0.8s_0.2s_ease-out_both]">
            <div className="w-full max-w-md aspect-4/3 rounded-2xl bg-linear-to-br from-indigo-200 via-indigo-300 to-indigo-400 dark:from-indigo-900 dark:via-indigo-800 dark:to-indigo-700 flex flex-col items-center justify-center shadow-2xl">
              <Layers className="size-16 text-indigo-700 dark:text-indigo-300" />
              <span className="mt-2 text-sm text-indigo-600/70 dark:text-indigo-300/70">
                {t('hero.appPreview')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 max-w-content px-4 md:px-2 mx-auto">
        <AnimatedSection className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 ">{t('about.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
            {t('about.description')}
          </p>
        </AnimatedSection>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 max-w-content px-4 md:px-2 mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t('features.sectionTitle')}</h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <AnimatedSection key={feature.key} delay={i * 150}>
              <div className="h-full text-center p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:-translate-y-2 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 rounded-xl bg-accent text-white flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="size-7" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {t(`features.${feature.key}.title` as 'features.verified.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(`features.${feature.key}.description` as 'features.verified.description')}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 max-w-content px-4 md:px-2 mx-auto">
        <AnimatedSection className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t('howItWorks.sectionTitle')}</h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <AnimatedSection key={step.key} delay={i * 150}>
              <div className="text-center">
                <div className={clsx('w-full aspect-video rounded-2xl mb-4 flex items-center justify-center bg-linear-to-br', step.gradient)}>
                  <step.icon className="size-12 opacity-60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t(`howItWorks.${step.key}.title` as 'howItWorks.step1.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                  {t(`howItWorks.${step.key}.description` as 'howItWorks.step1.description')}
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
            {t('howItWorks.readMore')}
            <ArrowRight className="size-4" />
          </AppLink>
        </AnimatedSection>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <AnimatedSection className="text-center max-w-lg mx-auto px-4 md:px-2">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
            {t('cta.subtitle')}
          </p>
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent text-white font-medium text-lg hover:opacity-90 transition-opacity"
          >
            <Download className="size-5" />
            {t('cta.button')}
          </a>
        </AnimatedSection>
      </section>
    </div>
  )
}
