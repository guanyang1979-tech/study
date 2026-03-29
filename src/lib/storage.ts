import { FlashCard, AppSettings } from './types';
import { initialCards } from '@/data/cards';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  CARDS: 'zhixi_cards',
  SETTINGS: 'zhixi_settings',
  STATS: 'zhixi_stats',
  USER_ID: 'zhixi_user_id'
} as const;

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'system',
  ttsEnabled: false,
  ttsSpeed: 1.0,
  webhookUrl: '',
  webhookEnabled: false
};

// 获取或生成用户ID
function getUserId(): string {
  if (typeof window === 'undefined') return 'default';
  let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!userId) {
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
  }
  return userId;
}

// 同步数据到云端
async function syncToCloud(cards: FlashCard[], settings: AppSettings) {
  if (typeof window === 'undefined') return;

  const userId = getUserId();
  try {
    await supabase.from('user_data').upsert({
      user_id: userId,
      cards: cards,
      settings: settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    console.log('数据已同步到云端');
  } catch (error) {
    console.error('同步到云端失败:', error);
  }
}

// 从云端加载数据
async function loadFromCloud(): Promise<{ cards?: FlashCard[]; settings?: AppSettings } | null> {
  if (typeof window === 'undefined') return null;

  const userId = getUserId();
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('cards, settings')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return { cards: data.cards, settings: data.settings };
  } catch (error) {
    console.error('从云端加载失败:', error);
    return null;
  }
}

/**
 * 获取所有卡片数据（从 LocalStorage 或云端或使用初始数据）
 */
export async function getCardsAsync(): Promise<FlashCard[]> {
  if (typeof window === 'undefined') return initialCards;

  // 先尝试从本地获取
  const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
  let cards: FlashCard[];

  if (stored) {
    try {
      cards = JSON.parse(stored);
    } catch {
      cards = initialCards;
    }
  } else {
    // 本地没有，尝试从云端获取
    const cloudData = await loadFromCloud();
    if (cloudData?.cards) {
      cards = cloudData.cards;
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      return cards;
    }
    cards = initialCards;
    saveCards(cards);
  }
  return cards;
}

/**
 * 保存卡片数据
 */
export async function saveCards(cards: FlashCard[]): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));

  // 同步到云端（从 localStorage 获取当前设置）
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  await syncToCloud(cards, settings);
}

/**
 * 更新单个卡片
 */
export async function updateCard(cardId: string, updates: Partial<FlashCard>): Promise<FlashCard[]> {
  const cards = await getCardsAsync();
  const updatedCards = cards.map(card =>
    card.id === cardId ? { ...card, ...updates } : card
  );
  await saveCards(updatedCards);
  return updatedCards;
}

/**
 * 添加新卡片
 */
export async function addCard(card: FlashCard): Promise<FlashCard[]> {
  const cards = await getCardsAsync();
  const newCards = [...cards, card];
  await saveCards(newCards);
  return newCards;
}

/**
 * 删除卡片
 */
export async function deleteCard(cardId: string): Promise<FlashCard[]> {
  const cards = await getCardsAsync();
  const newCards = cards.filter(card => card.id !== cardId);
  await saveCards(newCards);
  return newCards;
}

/**
 * 获取应用设置
 */
export async function getSettingsAsync(): Promise<AppSettings> {
  if (typeof window === 'undefined') return defaultSettings;

  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
      return defaultSettings;
    }
  }

  // 尝试从云端获取
  const cloudData = await loadFromCloud();
  if (cloudData?.settings) {
    const settings = { ...defaultSettings, ...cloudData.settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  }

  return defaultSettings;
}

/**
 * 保存应用设置
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

  // 同步到云端
  const cards = await getCardsAsync();
  await syncToCloud(cards, settings);
}

/**
 * 导出数据为 JSON 文件
 */
export async function exportData(): Promise<void> {
  const cards = await getCardsAsync();
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  const settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
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
export async function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // 支持两种格式：
        // 1. 完整备份格式：{ cards: [...], settings: {...} }
        // 2. 纯卡片数组格式：[{...}, {...}]
        let cardsToImport = [];
        if (Array.isArray(data)) {
          // 纯数组格式
          cardsToImport = data;
        } else if (data.cards && Array.isArray(data.cards)) {
          // 完整备份格式
          cardsToImport = data.cards;
          if (data.settings) {
            await saveSettings(data.settings);
          }
        }

        if (cardsToImport.length > 0) {
          // 获取现有卡片
          const existingCards = await getCardsAsync();
          // 合并卡片（避免重复）
          const existingIds = new Set(existingCards.map((c: FlashCard) => c.id));
          const newCards = cardsToImport.filter((c: FlashCard) => !existingIds.has(c.id));
          const mergedCards = [...existingCards, ...newCards];
          await saveCards(mergedCards);
        }

        resolve();
      } catch (error) {
        console.error('Import error:', error);
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
export async function resetData(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CARDS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.STATS);

  // 同步到云端（删除数据）
  await syncToCloud([], defaultSettings);
}

/**
 * 获取按章节分组的卡片
 */
export async function getCardsByChapter(): Promise<{ name: string; cards: FlashCard[] }[]> {
  const cards = await getCardsAsync();
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