import { FlashCard, AppSettings } from './types';
import { initialCards } from '@/data/cards';

const STORAGE_KEYS = {
  CARDS: 'zhixi_cards',
  SETTINGS: 'zhixi_settings',
  STATS: 'zhixi_stats'
} as const;

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'system',
  ttsEnabled: false,
  ttsSpeed: 1.0,
  webhookUrl: '',
  webhookEnabled: false
};

/**
 * 获取所有卡片数据（从 LocalStorage 或使用初始数据）
 */
export function getCards(): FlashCard[] {
  if (typeof window === 'undefined') return initialCards;

  const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialCards;
    }
  }
  // 首次使用时保存初始数据
  saveCards(initialCards);
  return initialCards;
}

/**
 * 保存卡片数据
 */
export function saveCards(cards: FlashCard[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
}

/**
 * 更新单个卡片
 */
export function updateCard(cardId: string, updates: Partial<FlashCard>): FlashCard[] {
  const cards = getCards();
  const updatedCards = cards.map(card =>
    card.id === cardId ? { ...card, ...updates } : card
  );
  saveCards(updatedCards);
  return updatedCards;
}

/**
 * 添加新卡片
 */
export function addCard(card: FlashCard): FlashCard[] {
  const cards = getCards();
  const newCards = [...cards, card];
  saveCards(newCards);
  return newCards;
}

/**
 * 删除卡片
 */
export function deleteCard(cardId: string): FlashCard[] {
  const cards = getCards();
  const newCards = cards.filter(card => card.id !== cardId);
  saveCards(newCards);
  return newCards;
}

/**
 * 获取应用设置
 */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return defaultSettings;

  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

/**
 * 保存应用设置
 */
export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

/**
 * 导出数据为 JSON 文件
 */
export function exportData(): void {
  const cards = getCards();
  const settings = getSettings();
  const data = { cards, settings, exportDate: new Date().toISOString() };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zhixi-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件导入数据
 */
export function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.cards) {
          saveCards(data.cards);
        }
        if (data.settings) {
          saveSettings(data.settings);
        }
        resolve();
      } catch {
        reject(new Error('Invalid file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * 重置所有数据
 */
export function resetData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CARDS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.STATS);
}

/**
 * 获取按章节分组的卡片
 */
export function getCardsByChapter(): { name: string; cards: FlashCard[] }[] {
  const cards = getCards();
  const chapterMap = new Map<string, FlashCard[]>();

  cards.forEach(card => {
    const chapter = card.chapter;
    if (!chapterMap.has(chapter)) {
      chapterMap.set(chapter, []);
    }
    chapterMap.get(chapter)!.push(card);
  });

  return Array.from(chapterMap.entries()).map(([name, cards]) => ({
    name,
    cards: cards.sort((a, b) => a.importance - b.importance)
  }));
}