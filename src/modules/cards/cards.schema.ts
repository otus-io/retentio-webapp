/**
 * 卡片某一面的条目（媒体字段为完整下载 URL）
 */
export interface CardEntry {
  field?: string
  text?: string
  audio?: string
  image?: string
  video?: string
}

export interface StudyCard {
  id: string
  fact_id: string
  template: number[][]
  /** Unix 秒 */
  last_review: number
  /** Unix 秒 */
  due_date: number
  hidden: boolean
  created_at: number
  front: CardEntry[]
  back: CardEntry[]
}

export type NextCardResponseDTO = BaseApiResult<{
  card?: StudyCard
  urgency?: number
  next_card?: StudyCard & { urgency: number }
}>

export interface ReviewCardDTO {
  card_id: string
  interval: number
  last_review: number
}

export type ReviewCardResponseDTO = BaseApiResult<{
  last_review: number
  due_date: number
  new_interval: number
}>

export type HideCardResponseDTO = BaseApiResult<{ hidden_status: boolean }>

export type DeleteCardResponseDTO = BaseApiResult<{ card_id: string }>

export interface CardStats {
  cards_count: number
  facts_count: number
  unseen_cards: number
  reviewed_cards: number
  due_cards: number
  hidden_cards: number
  new_cards_today: number
  last_reviewed_at: number
}

export type CardStatsResponseDTO = BaseApiResult<{ stats: CardStats }>

export interface ReviewDay {
  /** UTC `YYYYMMDD` */
  day: string
  count: number
}

export type ReviewsByDayResponseDTO = BaseApiResult<{ days: ReviewDay[], timezone: string }>

export interface IntervalRange {
  min: number
  max: number
  def: number
}

const MIN_INTERVAL_SEC = 300
const MIN_FACTOR = 0.5
const MAX_FACTOR = 4
const DEF_FACTOR = 2

/**
 * 计算复习间隔的允许范围（秒），规则见 docs/api.md「Review a Card」。
 * 小于 300 秒（含异常的 due_date <= last_review）一律按 300 秒计算。
 */
export function computeIntervalRange(nowSec: number, lastReview: number, dueDate: number): IntervalRange {
  const interval = Math.max(MIN_INTERVAL_SEC, dueDate - lastReview)
  const urgency = (nowSec - lastReview) / interval
  const scale = (factor: number) => urgency >= 1
    ? interval * factor
    : interval * ((factor - 1) * urgency + 1)
  const min = Math.round(scale(MIN_FACTOR))
  let max = Math.max(Math.round(scale(MAX_FACTOR)), min)
  if (max <= min) max = min * 4
  const def = Math.min(Math.max(Math.round(scale(DEF_FACTOR)), min), max)
  return { min, max, def }
}

export type IntervalUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'

const UNITS: [IntervalUnit, number][] = [
  ['year', 365 * 86400],
  ['month', 30 * 86400],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/**
 * 把秒数换成最大的合适单位（保留一位小数），用于 Intl 单位格式化。
 */
export function intervalToUnit(seconds: number): { value: number, unit: IntervalUnit } {
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return { value: Math.round((seconds / size) * 10) / 10, unit }
  }
  return { value: Math.round(seconds), unit: 'second' }
}

/**
 * 解析卡片媒体 URL（`…/api/media/{id}?v=3`）得到媒体 ID 与快照版本。
 */
export function parseMediaUrl(url: string): { id: string, version?: number } {
  const match = /\/api\/media\/([^/?#]+)(?:\?(.*))?/.exec(url)
  if (!match) return { id: url }
  const v = Number(new URLSearchParams(match[2] ?? '').get('v'))
  return v > 0 ? { id: match[1], version: v } : { id: match[1] }
}

export const REVIEW_RANGES = [7, 30, 90, 365] as const

export interface ReviewSummary {
  days: ReviewDay[]
  total: number
  today: number
  activeDays: number
  average: number
  /** 按 UTC 星期（0 = 周日）汇总 */
  weekdays: number[]
}

/**
 * 合并多个卡组的按天序列（按 day 求和）并计算汇总指标。
 */
export function summarizeReviewDays(series: ReviewDay[][]): ReviewSummary {
  const byDay = new Map<string, number>()
  for (const list of series) {
    for (const { day, count } of list) byDay.set(day, (byDay.get(day) ?? 0) + count)
  }
  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }))
  const weekdays = [0, 0, 0, 0, 0, 0, 0]
  let total = 0
  let activeDays = 0
  for (const { day, count } of days) {
    total += count
    if (count > 0) activeDays += 1
    weekdays[reviewDayToDate(day).getUTCDay()] += count
  }
  return {
    days,
    total,
    today: days.at(-1)?.count ?? 0,
    activeDays,
    average: days.length ? Math.round((total / days.length) * 10) / 10 : 0,
    weekdays,
  }
}

/** `YYYYMMDD` → UTC 零点 Date */
export function reviewDayToDate(day: string): Date {
  return new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(4, 6)) - 1, Number(day.slice(6, 8))))
}
