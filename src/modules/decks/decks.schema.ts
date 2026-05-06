import z from 'zod'

/**
 * 卡组
 */
export interface Deck {
  /**
   * 卡组ID
   */
  id: string;
  /**
   * 卡组名称
   */
  name: string;
  /**
   * 所有者
   */
  owner: string;
  /**
   * 字段列表
   */
  fields: string[];
  /**
   * 评分
   */
  rate: number;
  /**
   * 统计信息
   *
   * 统计信息是实时计算的。对于刚创建的空卡组，所有值都为 0。
   * 添加词条后，cards_count 和 unseen_cards 会增加。
   * 随着复习的进行，reviewed_cards 会增长，unseen_cards 会减少。
   *
   * 默认每词条一张卡（见 模板：默认与兄弟卡）。
   * 若需为某词条再增加一张卡（如反向卡），请调用 POST /api/decks/{id}/card，
   * body 传 {"fact_id": "<factId>", "template": [[1], [0]]}。
   * 若该 template 已存在则返回 400。
   *
   * 客户端计算学习进度百分比：reviewed_cards / cards_count * 100。
   */
  stats: Stats;
  /**
   * 创建时间
   */
  created_at: string;
  /**
   * 更新时间
   */
  updated_at: string;
}

interface Stats {
  /**
   * 卡片总数 - 卡组中的卡片总数
   */
  cards_count: number;
  /**
   * 词条总数 - 卡组中的词条总数
   */
  facts_count: number;
  /**
   * 未学习卡片 - 从未复习过的新卡片数量
   */
  unseen_cards: number;
  /**
   * 已学习卡片 - 已学习过至少一次的卡片数量
   */
  reviewed_cards: number;
  /**
   * 待复习卡片 - 当前待复习的卡片数量（due_date <= 当前时间）
   */
  due_cards: number;
  /**
   * 已隐藏卡片 - 被用户隐藏的卡片数量
   */
  hidden_cards: number;
  /**
   * 今日新增卡片 - 今天添加的卡片数量（从午夜开始计算）
   */
  new_cards_today: number;
  /**
   * 上次复习时间 - 最近一次复习的 Unix 时间戳（未复习过则为 0）
   */
  last_reviewed_at: number;
}

interface Meta {
  /**
   * 总数 - 当前用户拥有的卡组总数
   */
  total: string;
  /**
   * 消息 - 状态信息
   */
  msg: string;
}

/**
 * 创建或更新卡组请求 DTO
 */
export const crateOrUpdateDeckSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  fields: z.array(z.string().min(1, 'Field cannot be empty')).min(2, 'At least 2 fields are required'),
  rate: z.coerce.number().min(1, 'Rate must be at least 1').max(1000, 'Rate must be at most 1000'),
})

/**
 * 创建或更新卡组请求 DTO
 */
export type CreateOrUpdateDeckDTO = z.infer<typeof crateOrUpdateDeckSchema>

/**
 * 创建或更新卡组响应 DTO
 */
export type CreateOrUpdateDeckResponseDTO = BaseApiResult<{ deck_id: string }>

/**
 * 删除卡组
 */
export type DeleteDeckResponseDTO = BaseApiResult<{ deck_id: string }>

/**
 * 单个卡组
 */
export type DeckResponseDTO = BaseApiResult<Deck>

/**
 * 获取卡组列表的响应 DTO
 */
export type DecksListResponseDTO = BaseApiResult<{ decks: Deck[] }, Meta>
