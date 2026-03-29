import { FlashCard, SRSCard } from './types';

/**
 * 间隔重复算法（SM-2 改进版）
 * 基于艾宾浩斯遗忘曲线设计
 */

// 评分等级
export enum ReviewRating {
  FORGOT = 0,      // 完全忘记
  HARD_REMEMBER = 1,  // 错误但看到答案后想起
  ALMOST_FORGOT = 2,  // 错误但感觉快想起来了
  HARD_BUT_CORRECT = 3,  // 正确但很困难
  GOOD = 4,        // 正确且稍有犹豫
  PERFECT = 5     // 完全正确
}

/**
 * 计算下一次复习日期
 * @param card 当前卡片
 * @param rating 评分 (0-5)
 * @returns 更新后的 SRS 数据
 */
export function calculateNextReview(card: FlashCard, rating: ReviewRating): SRSCard {
  const { srs } = card;
  let { repetition, interval, ease_factor } = srs;

  // 评分低于3（没有记住），重置学习
  if (rating < 3) {
    repetition = 0;
    interval = 1; // 1天后重新复习
  } else {
    // 记住了，根据评分计算新的间隔
    if (repetition === 0) {
      interval = 1; // 第一次复习，1天后
    } else if (repetition === 1) {
      interval = 6; // 第二次复习，6天后
    } else {
      // 后续复习：interval * ease_factor
      interval = Math.round(interval * ease_factor);
    }
    repetition += 1;

    // 调整难度因子
    // 如果评分>=4，增加 ease_factor；如果评分<=2，减少 ease_factor
    ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

    // 确保 ease_factor 最小为 1.3
    if (ease_factor < 1.3) {
      ease_factor = 1.3;
    }
  }

  // 计算下次复习日期
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    repetition,
    interval,
    ease_factor: Math.round(ease_factor * 100) / 100, // 保留两位小数
    next_review_date: nextDate.toISOString()
  };
}

/**
 * 检查卡片是否到期需要复习
 * @param card 卡片
 * @returns 是否到期
 */
export function isCardDue(card: FlashCard): boolean {
  const now = new Date();
  const reviewDate = new Date(card.srs.next_review_date);
  return now >= reviewDate;
}

/**
 * 获取今日待复习的卡片
 * @param cards 所有卡片
 * @returns 待复习卡片数组
 */
export function getDueCards(cards: FlashCard[]): FlashCard[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return cards.filter(card => {
    const reviewDate = new Date(card.srs.next_review_date);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate <= now;
  }).sort((a, b) => {
    // 优先复习重要性和难度更高的卡片
    const scoreA = a.importance * (1 / (a.srs.ease_factor || 1));
    const scoreB = b.importance * (1 / (b.srs.ease_factor || 1));
    return scoreB - scoreA;
  });
}

/**
 * 统计学习进度
 * @param cards 所有卡片
 * @returns 统计数据
 */
export function getStudyStats(cards: FlashCard[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dueCards = cards.filter(card => isCardDue(card));
  const masteredCards = cards.filter(card => card.srs.repetition >= 5); // 复习5次以上视为已掌握
  const learningCards = cards.filter(card => card.srs.repetition > 0 && card.srs.repetition < 5);

  return {
    totalCards: cards.length,
    masteredCards: masteredCards.length,
    learningCards: learningCards.length,
    dueCards: dueCards.length,
    masteredRate: cards.length > 0 ? Math.round(masteredCards.length / cards.length * 100) : 0
  };
}

/**
 * 格式化日期为易读格式
 * @param dateStr ISO 日期字符串
 * @returns 格式化后的日期
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '明天';
  } else if (diffDays < 7) {
    return `${diffDays}天后`;
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)}周后`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

/**
 * 获取记忆状态标签
 * @param card 卡片
 * @returns 状态标签
 */
export function getMemoryStatus(card: FlashCard): { label: string; color: string } {
  const { repetition, ease_factor } = card.srs;

  if (repetition === 0) {
    return { label: '新卡片', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' };
  }
  if (repetition >= 5 && ease_factor >= 2.3) {
    return { label: '已掌握', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' };
  }
  if (repetition >= 2) {
    return { label: '学习中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' };
  }
  return { label: '复习中', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' };
}