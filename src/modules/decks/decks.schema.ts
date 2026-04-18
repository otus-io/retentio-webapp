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
  field: string[];
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
 * 获取卡组列表的响应 DTO
 */
export type DecksListResponseDTO = BaseApiResult<{ decks: Deck[] }, Meta>
