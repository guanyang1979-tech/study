import { FlashCard, AppSettings, StudyRecord, StudyHistory, DailyStats, WrongNote, Subject } from './types';
import { initialCards } from '@/data/cards';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  CARDS: 'zhixi_cards',
  SETTINGS: 'zhixi_settings',
  STATS: 'zhixi_stats',
  USER_ID: 'zhixi_user_id',
  STUDY_HISTORY: 'zhixi_study_history',
  WRONG_NOTES: 'zhixi_wrong_notes',
  SUBJECTS: 'zhixi_subjects',
  CURRENT_SUBJECT: 'zhixi_current_subject'
} as const;

// 默认设置
const defaultSettings: AppSettings = {
  theme: 'system',
  ttsEnabled: false,
  ttsSpeed: 1.0,
  webhookUrl: '',
  webhookEnabled: false
};

// 获取固定的用户ID（用于云端同步）
function getUserId(): string {
  // 固定的 userId，确保云端数据统一
  const FIXED_USER_ID = 'zhixi_master';

  // 确保只在客户端执行
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return FIXED_USER_ID;
  }

  try {
    // 尝试获取之前保存的自定义 userId（向后兼容）
    let userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

    // 如果没有或不是固定 ID，则使用固定的
    if (!userId || userId === 'default') {
      userId = FIXED_USER_ID;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
      console.log('设置固定userId:', userId);
    } else if (userId !== FIXED_USER_ID) {
      // 旧用户迁移到固定 ID
      console.log('迁移userId从:', userId, '到', FIXED_USER_ID);
      userId = FIXED_USER_ID;
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } else {
      console.log('使用固定userId:', userId);
    }

    return userId;
  } catch (e) {
    console.error('localStorage 不可用:', e);
    return FIXED_USER_ID;
  }
}

// 同步数据到云端
async function syncToCloud(cards: FlashCard[], settings: AppSettings) {
  if (typeof window === 'undefined') return;

  const userId = getUserId();
  console.log('开始同步到云端, userId:', userId, 'cards数量:', cards.length);

  try {
    const { error } = await supabase.from('user_data').upsert({
      user_id: userId,
      cards: cards,
      settings: settings,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('同步到云端失败:', error);
    } else {
      console.log('数据已同步到云端');
    }
  } catch (error) {
    console.error('同步到云端异常:', error);
  }
}

// 从云端加载数据
async function loadFromCloud(): Promise<{ cards?: FlashCard[]; settings?: AppSettings } | null> {
  if (typeof window === 'undefined') return null;

  const userId = getUserId();
  console.log('从云端加载, userId:', userId);

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('cards, settings')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('从云端加载失败:', error);
      return null;
    }

    if (!data) {
      console.log('云端没有该用户的数据');
      return null;
    }

    if (data.cards && !Array.isArray(data.cards)) {
      console.warn('云端数据格式异常');
      return null;
    }

    console.log('从云端加载了', data.cards?.length, '张卡片');
    return { cards: data.cards, settings: data.settings };
  } catch (error) {
    console.error('从云端加载异常:', error);
    return null;
  }
}

/**
 * 标准化卡片数据，确保每张卡片都有subjectId
 */
function normalizeCards(cards: FlashCard[]): FlashCard[] {
  return cards.map(card => ({
    ...card,
    subjectId: card.subjectId || 'default'
  }));
}

/**
 * 获取所有卡片数据（优先从云端同步，确保数据一致）
 */
export async function getCardsAsync(): Promise<FlashCard[]> {
  if (typeof window === 'undefined') return initialCards;

  // 先尝试从云端获取最新数据
  console.log('检查云端数据...');
  const cloudData = await loadFromCloud();
  if (cloudData?.cards && Array.isArray(cloudData.cards) && cloudData.cards.length > 0) {
    console.log('从云端同步了', cloudData.cards.length, '张卡片');
    // 保存到本地
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cloudData.cards));
    // 确保所有卡片都有subjectId
    return normalizeCards(cloudData.cards);
  }

  // 云端没有数据，再检查本地
  const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('使用本地缓存数据:', parsed.length, '张卡片');
        // 确保所有卡片都有subjectId
        return normalizeCards(parsed);
      }
    } catch (error) {
      console.error('解析本地数据失败:', error);
      localStorage.removeItem(STORAGE_KEYS.CARDS);
    }
  }

  // 使用初始数据
  return initialCards;
}

/**
 * 保存卡片数据
 */
export async function saveCards(cards: FlashCard[]): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 保存到本地存储
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    // 同时同步到云端
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const settings = stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    await syncToCloud(cards, settings);
  } catch (error) {
    console.error('保存卡片失败:', error);
  }
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
 * 验证卡片数据格式
 */
function validateCard(card: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必填字段检查
  if (!card.id || typeof card.id !== 'string') {
    errors.push('缺少必填字段: id');
  }
  if (!card.chapter || typeof card.chapter !== 'string') {
    errors.push('缺少必填字段: chapter');
  }
  if (!card.section || typeof card.section !== 'string') {
    errors.push('缺少必填字段: section');
  }
  if (!card.topic || typeof card.topic !== 'string') {
    errors.push('缺少必填字段: topic');
  }
  if (!card.front || typeof card.front !== 'string') {
    errors.push('缺少必填字段: front');
  }
  if (!card.back || typeof card.back !== 'string') {
    errors.push('缺少必填字段: back');
  }

  // importance 必须是 1-5
  if (typeof card.importance !== 'number' || card.importance < 1 || card.importance > 5) {
    errors.push('importance 必须是 1-5 的数字');
  }

  // tags 必须是数组
  if (!Array.isArray(card.tags)) {
    errors.push('tags 必须是数组');
  }

  // srs 字段检查
  if (!card.srs || typeof card.srs !== 'object') {
    errors.push('缺少必填字段: srs');
  } else {
    if (typeof card.srs.repetition !== 'number') {
      errors.push('srs.repetition 必须是数字');
    }
    if (typeof card.srs.interval !== 'number') {
      errors.push('srs.interval 必须是数字');
    }
    if (typeof card.srs.ease_factor !== 'number') {
      errors.push('srs.ease_factor 必须是数字');
    }
    if (!card.srs.next_review_date) {
      errors.push('srs.next_review_date 是必填');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 检查卡片内容是否完全相同（用于重复检测）
 */
function isCardContentSame(card1: FlashCard, card2: FlashCard): boolean {
  return (
    card1.front === card2.front &&
    card1.back === card2.back &&
    card1.chapter === card2.chapter &&
    card1.section === card2.section &&
    card1.topic === card2.topic
  );
}

/**
 * 从 JSON 文件导入数据
 * @param file JSON文件
 * @param subjectId 导入目标学科ID（如果不传则使用当前学科）
 */
export async function importData(file: File, subjectId?: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  const targetSubjectId = subjectId || getCurrentSubjectId();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // 支持两种格式：
        // 1. 完整备份格式：{ cards: [...], settings: {...} }
        // 2. 纯卡片数组格式：[{...}, {...}]
        let cardsToImport: FlashCard[] = [];

        if (Array.isArray(data)) {
          // 纯数组格式
          cardsToImport = data.map((card: any) => ({
            ...card,
            subjectId: targetSubjectId, // 强制设置学科ID
            srs: card.srs || {
              repetition: 0,
              interval: 0,
              ease_factor: 2.5,
              next_review_date: new Date().toISOString()
            }
          }));
        } else if (data.cards && Array.isArray(data.cards)) {
          // 完整备份格式
          cardsToImport = data.cards.map((card: any) => ({
            ...card,
            subjectId: targetSubjectId // 强制设置学科ID
          }));
          if (data.settings) {
            await saveSettings(data.settings).catch(() => {});
          }
        } else {
          reject(new Error('无效的文件格式'));
          return;
        }

        if (cardsToImport.length > 0) {
          // 步骤1: 验证所有卡片格式
          const invalidCards: { index: number; errors: string[] }[] = [];
          cardsToImport.forEach((card, index) => {
            const validation = validateCard(card);
            if (!validation.valid) {
              invalidCards.push({ index, errors: validation.errors });
            }
          });

          if (invalidCards.length > 0) {
            result.errors = invalidCards.slice(0, 5).map(c =>
              `第 ${c.index + 1} 张卡片: ${c.errors.join(', ')}`
            );
            reject(new Error(`数据格式验证失败:\n${result.errors.join('\n')}`));
            return;
          }

          // 步骤2: 获取现有卡片并检查重复
          const existingCards = await getCardsAsync();
          const existingIds = new Set(existingCards.map((c: FlashCard) => c.id));
          const newCards: FlashCard[] = [];
          const duplicateCards: FlashCard[] = [];

          for (const card of cardsToImport) {
            if (!card.id) continue;

            // 检查 ID 是否已存在
            if (existingIds.has(card.id)) {
              // 检查内容是否相同
              const existingCard = existingCards.find((c: FlashCard) => c.id === card.id);
              if (existingCard && !isCardContentSame(card, existingCard)) {
                // ID 相同但内容不同，需要更新
                newCards.push(card);
              } else {
                // 完全重复，跳过
                duplicateCards.push(card);
                result.skipped++;
              }
            } else {
              // 全新卡片
              newCards.push(card);
            }
          }

          // 步骤3: 合并并保存
          if (newCards.length > 0) {
            // 移除重复的 ID（用新的替换旧的）
            const filteredExisting = existingCards.filter(
              (c: FlashCard) => !newCards.some(nc => nc.id === c.id)
            );
            const mergedCards = [...filteredExisting, ...newCards];
            await saveCards(mergedCards);
            result.imported = newCards.length;
          }
        }

        resolve(result);
      } catch (error) {
        console.error('Import error:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * 更新单个卡片（用于编辑后保存）
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
export async function getCardsByChapter(cards?: FlashCard[]): Promise<{ name: string; cards: FlashCard[] }[]> {
  // 如果没有传入卡片数据，才从云端获取
  const cardData = cards || await getCardsAsync();
  const chapterMap = new Map<string, FlashCard[]>();

  cardData.forEach(card => {
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

// ==================== 学习记录功能 ====================

/**
 * 获取学习历史
 */
export function getStudyHistory(): StudyHistory {
  if (typeof window === 'undefined') {
    return { records: [], dailyStats: [], streakDays: 0, lastStudyDate: '' };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.STUDY_HISTORY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { records: [], dailyStats: [], streakDays: 0, lastStudyDate: '' };
    }
  }
  return { records: [], dailyStats: [], streakDays: 0, lastStudyDate: '' };
}

/**
 * 保存学习历史
 */
function saveStudyHistory(history: StudyHistory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('保存学习历史失败:', error);
  }
}

/**
 * 记录单次学习
 */
export function recordStudy(
  card: FlashCard,
  rating: number,
  responseTime?: number
): void {
  const history = getStudyHistory();
  const now = new Date();

  // 创建学习记录
  const record: StudyRecord = {
    cardId: card.id,
    chapter: card.chapter,
    topic: card.topic,
    rating,
    reviewDate: now.toISOString(),
    nextReviewDate: card.srs.next_review_date,
    responseTime
  };

  // 添加记录
  history.records.push(record);

  // 更新每日统计
  const today = now.toISOString().split('T')[0];
  let dailyStat = history.dailyStats.find(d => d.date === today);

  if (!dailyStat) {
    dailyStat = {
      date: today,
      cardsStudied: 0,
      remembered: 0,
      forgot: 0,
      duration: 0
    };
    history.dailyStats.push(dailyStat);
  }

  dailyStat.cardsStudied += 1;
  if (rating >= 3) {
    dailyStat.remembered += 1;
  } else {
    dailyStat.forgot += 1;
  }

  // 计算学习时长（简化计算）
  if (responseTime) {
    dailyStat.duration += Math.round(responseTime / 60000);
  }

  // 更新连续学习天数
  const lastDate = history.lastStudyDate ? new Date(history.lastStudyDate) : null;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!lastDate) {
    history.streakDays = 1;
  } else if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
    history.streakDays += 1;
  } else if (lastDate.toISOString().split('T')[0] !== today) {
    history.streakDays = 1;
  }

  history.lastStudyDate = now.toISOString();

  // 只保留最近365天的数据
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  history.records = history.records.filter(r => new Date(r.reviewDate) >= oneYearAgo);
  history.dailyStats = history.dailyStats.filter(d => new Date(d.date) >= oneYearAgo);

  saveStudyHistory(history);
}

/**
 * 获取今日学习统计
 */
export function getTodayStats(): { studied: number; remembered: number; forgot: number } {
  const history = getStudyHistory();
  const today = new Date().toISOString().split('T')[0];
  const todayStat = history.dailyStats.find(d => d.date === today);

  return {
    studied: todayStat?.cardsStudied || 0,
    remembered: todayStat?.remembered || 0,
    forgot: todayStat?.forgot || 0
  };
}

/**
 * 获取本周学习统计
 */
export function getWeekStats(): { studied: number; days: number; average: number } {
  const history = getStudyHistory();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekStats = history.dailyStats.filter(d => new Date(d.date) >= weekAgo);
  const totalStudied = weekStats.reduce((sum, d) => sum + d.cardsStudied, 0);

  return {
    studied: totalStudied,
    days: weekStats.length,
    average: weekStats.length > 0 ? Math.round(totalStudied / weekStats.length) : 0
  };
}

/**
 * 获取连续学习天数
 */
export function getStreakDays(): number {
  return getStudyHistory().streakDays;
}

/**
 * 获取即将需要复习的卡片（未来3天）
 */
export function getUpcomingReviews(cards: FlashCard[]): FlashCard[] {
  const now = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  return cards.filter(card => {
    const reviewDate = new Date(card.srs.next_review_date);
    return reviewDate > now && reviewDate <= threeDaysLater;
  }).sort((a, b) => {
    return new Date(a.srs.next_review_date).getTime() - new Date(b.srs.next_review_date).getTime();
  });
}

// ==================== 错题本功能 ====================

/**
 * 获取错题本
 */
export function getWrongNotes(): WrongNote[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.WRONG_NOTES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * 保存错题本
 */
function saveWrongNotes(notes: WrongNote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WRONG_NOTES, JSON.stringify(notes));
}

/**
 * 记录错误（答错时调用）
 */
export function recordWrongAnswer(cardId: string, subjectId: string): void {
  const notes = getWrongNotes();
  const existing = notes.find(n => n.cardId === cardId);
  const now = new Date().toISOString();

  if (existing) {
    existing.wrongCount += 1;
    existing.lastWrongDate = now;
    existing.correctCount = 0; // 重置连续正确次数
  } else {
    notes.push({
      cardId,
      wrongCount: 1,
      lastWrongDate: now,
      correctCount: 0,
      addedDate: now,
      subjectId
    });
  }

  saveWrongNotes(notes);
}

/**
 * 记录正确（答对时调用）
 */
export function recordCorrectAnswer(cardId: string): void {
  const notes = getWrongNotes();
  const existing = notes.find(n => n.cardId === cardId);

  if (existing) {
    existing.correctCount += 1;
    // 连续答对3次后移除
    if (existing.correctCount >= 3) {
      const newNotes = notes.filter(n => n.cardId !== cardId);
      saveWrongNotes(newNotes);
      return;
    }
    saveWrongNotes(notes);
  }
}

/**
 * 获取错题卡片
 */
export function getWrongNoteCards(cards: FlashCard[]): FlashCard[] {
  const notes = getWrongNotes();
  const wrongIds = new Set(notes.map(n => n.cardId));
  return cards.filter(card => wrongIds.has(card.id));
}

// ==================== 多学科功能 ====================

/**
 * 获取所有学科
 */
export function getSubjects(): Subject[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  // 返回默认学科
  return [{
    id: 'default',
    name: '默认学科',
    description: '默认学习科目',
    color: '#3B82F6',
    createdAt: new Date().toISOString()
  }];
}

/**
 * 保存学科列表
 */
function saveSubjects(subjects: Subject[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
}

/**
 * 添加学科
 */
export function addSubject(name: string, description: string, color: string): Subject {
  const subjects = getSubjects();
  const newSubject: Subject = {
    id: 'subject_' + Date.now(),
    name,
    description,
    color,
    createdAt: new Date().toISOString()
  };
  subjects.push(newSubject);
  saveSubjects(subjects);
  return newSubject;
}

/**
 * 删除学科
 */
export function deleteSubject(subjectId: string): void {
  const subjects = getSubjects().filter(s => s.id !== subjectId);
  saveSubjects(subjects);
}

/**
 * 更新学科信息
 */
export function updateSubject(subjectId: string, updates: Partial<Pick<Subject, 'name' | 'description' | 'color'>>): void {
  const subjects = getSubjects();
  const index = subjects.findIndex(s => s.id === subjectId);
  if (index !== -1) {
    subjects[index] = { ...subjects[index], ...updates };
    saveSubjects(subjects);
  }
}

/**
 * 获取当前学科
 */
export function getCurrentSubjectId(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SUBJECT) || 'default';
}

/**
 * 设置当前学科
 */
export function setCurrentSubjectId(subjectId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CURRENT_SUBJECT, subjectId);
}

/**
 * 获取当前学科信息
 */
export function getCurrentSubject(): Subject {
  const subjects = getSubjects();
  const currentId = getCurrentSubjectId();
  return subjects.find(s => s.id === currentId) || subjects[0] || {
    id: 'default',
    name: '默认学科',
    description: '默认学习科目',
    color: '#3B82F6',
    createdAt: new Date().toISOString()
  };
}