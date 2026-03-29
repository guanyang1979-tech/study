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