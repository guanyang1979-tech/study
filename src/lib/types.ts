/**
 * 知识点卡片类型定义
 * 对应用户提供的 JSON 数据结构
 */

export interface SRSCard {
  /** 重复次数 */
  repetition: number;
  /** 间隔天数 */
  interval: number;
  /** 难度因子 */
  ease_factor: number;
  /** 下次复习日期 */
  next_review_date: string;
}

export interface FlashCard {
  /** 唯一标识符 */
  id: string;
  /** 章节名称 */
  chapter: string;
  /** 小节名称 */
  section: string;
  /** 知识点主题 */
  topic: string;
  /** 问题/正面内容 */
  front: string;
  /** 答案/背面内容（支持 Markdown） */
  back: string;
  /** 重要性等级 1-5 */
  importance: number;
  /** 标签 */
  tags: string[];
  /** 实务思考/实际应用链接 */
  practical_link?: string;
  /** 附件路径 */
  attachments?: string[];
  /** 间隔重复学习数据 */
  srs: SRSCard;
}

/**
 * 用户学习统计
 */
export interface StudyStats {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  dueCards: number;
  streakDays: number;
  lastStudyDate: string;
}

/**
 * 应用设置
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  ttsEnabled: boolean;
  ttsSpeed: number;
  ttsVoice?: string;
  webhookUrl: string;
  webhookEnabled: boolean;
}

/**
 * 章节分组
 */
export interface ChapterGroup {
  name: string;
  cards: FlashCard[];
}

/**
 * 学习记录（单次学习）
 */
export interface StudyRecord {
  /** 卡片ID */
  cardId: string;
  /** 章节名称 */
  chapter: string;
  /** 知识点主题 */
  topic: string;
  /** 评分 */
  rating: number;
  /** 学习日期 */
  reviewDate: string;
  /** 下次复习日期 */
  nextReviewDate: string;
  /** 响应时间（毫秒） */
  responseTime?: number;
}

/**
 * 每日学习统计
 */
export interface DailyStats {
  /** 日期 */
  date: string;
  /** 学习卡片数 */
  cardsStudied: number;
  /** 记住数量 */
  remembered: number;
  /** 忘记数量 */
  forgot: number;
  /** 学习时长（分钟） */
  duration: number;
}

/**
 * 完整学习历史
 */
export interface StudyHistory {
  records: StudyRecord[];
  dailyStats: DailyStats[];
  streakDays: number;
  lastStudyDate: string;
}

/**
 * 错题本记录
 */
export interface WrongNote {
  /** 卡片ID */
  cardId: string;
  /** 错误次数 */
  wrongCount: number;
  /** 上次错误日期 */
  lastWrongDate: string;
  /** 连续正确次数 */
  correctCount: number;
  /** 加入错题本日期 */
  addedDate: string;
  /** 学科ID */
  subjectId: string;
}

/**
 * 学科/科目
 */
export interface Subject {
  /** 学科ID */
  id: string;
  /** 学科名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 主题色 */
  color: string;
  /** 创建时间 */
  createdAt: string;
}