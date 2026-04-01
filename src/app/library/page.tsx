'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronRight, FileText, Tag, Clock, Download, Upload, Loader2, X, ChevronUp, LayoutList, BookOpen, Sparkles } from 'lucide-react';
import { getCardsAsync, getCardsByChapter, exportData, importData, updateCard } from '@/lib/storage';
import { formatDate, getMemoryStatus } from '@/lib/srs';
import { useModal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { FlashCard } from '@/lib/types';

type ViewMode = 'chapter' | 'list';

export default function LibraryPage() {
  const { alert } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [chapters, setChapters] = useState<{ name: string; cards: FlashCard[] }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedCard, setSelectedCard] = useState<FlashCard | null>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FlashCard>>({});
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // 使用 useMemo 缓存过滤后的数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const allCards = await getCardsAsync();
        const chapterData = await getCardsByChapter(allCards); // 传递卡片数据，避免重复获取
        setCards(allCards);
        setChapters(chapterData);
        // 默认展开所有章节
        if (allCards.length > 0) {
          setExpandedChapters(new Set(allCards.map(c => c.chapter)));
        }
      } catch (e) {
        console.error('Failed to load cards:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 过滤卡片 - 使用 useMemo 避免重复计算
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // 搜索过滤 - 更全面的搜索
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        card.topic.toLowerCase().includes(searchLower) ||
        card.front.toLowerCase().includes(searchLower) ||
        card.back.toLowerCase().includes(searchLower) ||
        card.chapter.toLowerCase().includes(searchLower) ||
        card.section.toLowerCase().includes(searchLower) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchLower));

      // 状态过滤
      let matchesFilter = true;
      if (filter === 'new') {
        matchesFilter = card.srs.repetition === 0;
      } else if (filter === 'learning') {
        matchesFilter = card.srs.repetition > 0 && card.srs.repetition < 5;
      } else if (filter === 'mastered') {
        matchesFilter = card.srs.repetition >= 5;
      }

      return matchesSearch && matchesFilter;
    });
  }, [cards, searchQuery, filter]);

  // 按章节分组过滤后的卡片
  const filteredChapters = useMemo(() => {
    return chapters.map(chapter => ({
      ...chapter,
      cards: chapter.cards.filter(card => filteredCards.includes(card))
    })).filter(chapter => chapter.cards.length > 0);
  }, [chapters, filteredCards]);

  // 切换章节展开状态
  const toggleChapter = (chapterName: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterName)) {
        newSet.delete(chapterName);
      } else {
        newSet.add(chapterName);
      }
      return newSet;
    });
  };

  // 处理文件导入
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await importData(file);
        // 重新加载数据
        const allCards = await getCardsAsync();
        const chapterData = await getCardsByChapter(allCards);
        setCards(allCards);
        setChapters(chapterData);
        if (result.imported > 0) {
          await alert(`导入成功！\n新增: ${result.imported} 张\n跳过(重复): ${result.skipped} 张`);
        } else if (result.skipped > 0) {
          await alert(`所有卡片已存在，无需导入。\n跳过: ${result.skipped} 张`, 'alert');
        }
      } catch (error: any) {
        await alert(`导入失败\n${error.message || '请检查文件格式'}`, 'alert');
      }
    }
  };

  // 开始编辑卡片
  const handleEditCard = (card: FlashCard) => {
    setEditForm({ ...card });
    setIsEditing(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editForm.id) return;

    try {
      const updatedCards = await updateCard(editForm.id, editForm);
      setCards(updatedCards);
      // 重新加载章节数据
      const chapterData = await getCardsByChapter(updatedCards);
      setChapters(chapterData);
      // 更新选中的卡片
      const updated = updatedCards.find(c => c.id === editForm.id);
      if (updated) {
        setSelectedCard(updated);
      }
      setIsEditing(false);
      await alert('保存成功！已同步到云端');
    } catch (error) {
      await alert('保存失败', 'alert');
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  // 格式化答案文本（去除 Markdown 格式）
  const formatContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^### (.+)$/gm, '$1')
      .replace(/^## (.+)$/gm, '$1')
      .replace(/^# (.+)$/gm, '$1');
  };

  // 统计信息
  const stats = {
    total: cards.length,
    new: cards.filter(c => c.srs.repetition === 0).length,
    learning: cards.filter(c => c.srs.repetition > 0 && c.srs.repetition < 5).length,
    mastered: cards.filter(c => c.srs.repetition >= 5).length
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-500">加载中...</span>
      </div>
    );
  }

  // 空数据状态
  if (cards.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          暂无知识卡片
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          请导入或添加卡片数据
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
        <Button
          variant="secondary"
          icon={<Upload className="w-4 h-4" />}
          onClick={() => fileInputRef.current?.click()}
        >
          导入数据
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            知识库
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            共 {stats.total} 张卡片，已加载 {filteredCards.length} 张
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* 视图切换 */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              列表
            </button>
            <button
              onClick={() => setViewMode('chapter')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'chapter'
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              章节
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={exportData}
          >
            导出数据
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Upload className="w-4 h-4" />}
            onClick={() => fileInputRef.current?.click()}
          >
            导入数据
          </Button>
        </div>
      </div>

      {/* 多学科提示 */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-500 rounded-lg mt-0.5">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              支持多学科管理
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              导入卡片时会自动导入到当前选中的学科。点击首页顶部的学科名称可以切换当前学习科目，不同学科的卡片和学习进度相互独立。
            </p>
          </div>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索卡片...（支持搜索问题、答案、章节、标签）"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          >
            <option value="all">全部卡片</option>
            <option value="new">新卡片</option>
            <option value="learning">学习中</option>
            <option value="mastered">已掌握</option>
          </select>
        </div>
      </div>

      {/* 统计标签 */}
      <div className="flex flex-wrap gap-2 mb-8">
        <StatBadge count={stats.total} label="全部" active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatBadge count={stats.new} label="新卡片" active={filter === 'new'} onClick={() => setFilter('new')} />
        <StatBadge count={stats.learning} label="学习中" active={filter === 'learning'} onClick={() => setFilter('learning')} />
        <StatBadge count={stats.mastered} label="已掌握" active={filter === 'mastered'} onClick={() => setFilter('mastered')} />
      </div>

      {/* 列表视图 - 显示所有卡片 */}
      {viewMode === 'list' && (
        <div className="space-y-3 mb-24">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                没有找到匹配的卡片
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                尝试调整搜索关键词或筛选条件
              </p>
            </div>
          ) : (
            filteredCards.map((card) => {
              const status = getMemoryStatus(card);
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedCard(card)}
                  className={`
                    p-5 bg-white dark:bg-slate-800 rounded-2xl cursor-pointer
                    border-2 transition-all hover:shadow-lg
                    ${selectedCard?.id === card.id
                      ? 'border-blue-500 shadow-blue-500/20'
                      : 'border-transparent shadow-md shadow-slate-200/50 dark:shadow-slate-900/50 hover:border-slate-200 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {card.chapter.replace(/^\d+\.\s*/, '')}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(card.srs.next_review_date)}
                        </span>
                      </div>
                      <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-2">
                        {card.topic}
                      </h4>
                      <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                        <span className="font-medium">问题：</span>{card.front}
                      </div>
                    </div>
                  </div>

                  {/* 答案预览 */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      <span className="font-medium">答案：</span>{formatContent(card.back)}
                    </p>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {card.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* 章节视图 */}
      {viewMode === 'chapter' && (
        <div className="space-y-4">
          {filteredChapters.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              没有找到匹配的卡片
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              尝试调整搜索关键词或筛选条件
            </p>
          </div>
        ) : (
          filteredChapters.map((chapter) => {
            const isExpanded = expandedChapters.has(chapter.name);
            return (
              <motion.div
                key={chapter.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
              >
                {/* 章节标题 */}
                <button
                  onClick={() => toggleChapter(chapter.name)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {chapter.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                        {chapter.name.replace(/^\d+\.\s*/, '')}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {chapter.cards.length} 张卡片
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* 卡片列表 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-700"
                    >
                      <div className="p-4 space-y-2">
                        {chapter.cards.map((card) => {
                          const status = getMemoryStatus(card);
                          return (
                            <motion.div
                              key={card.id}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => setSelectedCard(card)}
                              className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                      {status.label}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDate(card.srs.next_review_date)}
                                    </span>
                                  </div>
                                  <h4 className="font-medium text-slate-800 dark:text-slate-100 truncate">
                                    {card.topic}
                                  </h4>
                                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                    {card.front}
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                              </div>

                              {/* 标签 */}
                              <div className="flex flex-wrap gap-1 mt-3">
                                {card.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-white dark:bg-slate-600 rounded text-xs text-slate-600 dark:text-slate-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
        </div>
      )}

      {/* 卡片详情面板 - 显示在页面底部 */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl z-50 max-h-[70vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {isEditing ? '' : selectedCard.section}
                </span>
                <div className="flex gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => handleEditCard(selectedCard)}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      编辑
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedCard(null); setIsEditing(false); }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                // 编辑模式
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      主题
                    </label>
                    <input
                      type="text"
                      value={editForm.topic || ''}
                      onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      问题
                    </label>
                    <textarea
                      value={editForm.front || ''}
                      onChange={(e) => setEditForm({ ...editForm, front: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      答案
                    </label>
                    <textarea
                      value={editForm.back || ''}
                      onChange={(e) => setEditForm({ ...editForm, back: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                      实务思考
                    </label>
                    <textarea
                      value={editForm.practical_link || ''}
                      onChange={(e) => setEditForm({ ...editForm, practical_link: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>保存</Button>
                    <Button variant="ghost" onClick={handleCancelEdit}>取消</Button>
                  </div>
                </div>
              ) : (
                // 浏览模式
                <>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                    {selectedCard.topic}
                  </h2>

                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      问题
                    </h3>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {selectedCard.front}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      答案
                    </h3>
                    <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                      {formatContent(selectedCard.back)}
                    </div>
                  </div>

                  {selectedCard.practical_link && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                        实务思考
                      </h3>
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-slate-800 dark:text-slate-200 text-sm">
                        {selectedCard.practical_link}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {selectedCard.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedCard(null)}
                    className="mt-4 w-full py-2 text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    点击收起详情
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 统计标签组件
function StatBadge({ count, label, active, onClick }: {
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${active
          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }
      `}
    >
      {label} <span className="ml-1 opacity-70">({count})</span>
    </button>
  );
}