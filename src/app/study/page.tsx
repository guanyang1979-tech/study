'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Trophy, RefreshCw, X, BookOpen, Clock, ChevronLeft } from 'lucide-react';
import { getCardsAsync, updateCard, getSettingsAsync, getCardsByChapter } from '@/lib/storage';
import { getDueCards, calculateNextReview, ReviewRating, getStudyStats } from '@/lib/srs';
import { StudyCard } from '@/components/StudyCard';
import { Button } from '@/components/Button';
import { FlashCard } from '@/lib/types';
import Link from 'next/link';

export default function StudyPage() {
  const [allCards, setAllCards] = useState<FlashCard[]>([]);
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('zh-CN');
  const [speaking, setSpeaking] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chapters, setChapters] = useState<{ name: string; cards: FlashCard[] }[]>([]);

  useEffect(() => {
    getCardsAsync().then(cards => {
      setAllCards(cards);
      // 获取章节数据（传入卡片数据避免重复获取）
      getCardsByChapter(cards).then(ch => setChapters(ch));
    });

    getSettingsAsync().then(settings => {
      setTtsEnabled(settings.ttsEnabled);
      setTtsVoice(settings.ttsVoice || 'zh-CN');
    });
  }, []);

  // 根据选择的章节筛选卡片
  useEffect(() => {
    let filteredDue = getDueCards(allCards);
    if (selectedChapter) {
      filteredDue = filteredDue.filter(card => card.chapter === selectedChapter);
    }
    setDueCards(filteredDue);
    setCurrentIndex(0);
    setCompletedCount(0);
    setStudyComplete(false);
  }, [selectedChapter, allCards]);

  // 处理评分
  const handleRate = async (rating: number) => {
    if (currentIndex >= dueCards.length) return;

    const card = dueCards[currentIndex];
    const newSRS = calculateNextReview(card, rating as ReviewRating);

    // 更新卡片数据（异步保存到本地和云端）
    await updateCard(card.id, { srs: newSRS });

    // 移动到下一张
    setCompletedCount(prev => prev + 1);

    if (currentIndex + 1 >= dueCards.length) {
      setStudyComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // TTS 语音播报 - 使用设置中的音色
  const handleSpeak = useCallback((text: string) => {
    if (!ttsEnabled || speaking) return;

    // 停止当前播放
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 尝试找到匹配的语音
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchedVoice = voices.find(v => v.lang === ttsVoice);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.lang = ttsVoice; // 使用设置中的语音
    utterance.rate = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, speaking, ttsVoice]);

  // 停止语音播报
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  // 切换语音开关
  const toggleTTS = () => {
    if (speaking) {
      stopSpeaking();
    } else {
      setTtsEnabled(!ttsEnabled);
    }
  };

  // 重新开始学习
  const restartStudy = () => {
    let filteredDue = getDueCards(allCards);
    if (selectedChapter) {
      filteredDue = filteredDue.filter(card => card.chapter === selectedChapter);
    }
    setDueCards(filteredDue);
    setCurrentIndex(0);
    setCompletedCount(0);
    setStudyComplete(false);
  };

  // 当前卡片
  const currentCard = dueCards[currentIndex];

  // 进度百分比
  const progress = dueCards.length > 0
    ? Math.round((completedCount / dueCards.length) * 100)
    : 0;

  // 获取当前章节名称
  const currentChapterName = currentCard?.chapter || selectedChapter || '全部';

  if (allCards.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            暂无学习卡片
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            请先导入卡片数据
          </p>
          <Link href="/library">
            <Button icon={<BookOpen className="w-4 h-4" />}>
              前往知识库
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // 空卡片状态
  if (dueCards.length === 0) {
    return (
      <div className="flex min-h-[80vh]">
        {/* 侧边栏 */}
        <ChapterSidebar
          chapters={chapters}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          currentCard={null}
        />

        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Trophy className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              没有待复习的卡片
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              请选择其他章节学习
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                  返回首页
                </Button>
              </Link>
              <Button onClick={restartStudy} icon={<RefreshCw className="w-4 h-4" />}>
                重新学习
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (studyComplete) {
    const stats = getStudyStats(allCards);
    return (
      <div className="flex min-h-[80vh]">
        {/* 侧边栏 */}
        <ChapterSidebar
          chapters={chapters}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
          showSidebar={showSidebar}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          currentCard={null}
        />

        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <Trophy className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              恭喜完成复习！
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              你已完成 {completedCount} 张卡片的学习
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.totalCards}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">总卡片数</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-xl">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.masteredRate}%
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">掌握率</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                  返回首页
                </Button>
              </Link>
              <Button onClick={restartStudy} icon={<RefreshCw className="w-4 h-4" />}>
                重新学习
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* 侧边栏 */}
      <ChapterSidebar
        chapters={chapters}
        selectedChapter={selectedChapter}
        onSelectChapter={setSelectedChapter}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        currentCard={currentCard}
      />

      {/* 主内容区 */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        {/* 顶部进度条 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                  返回
                </Button>
              </Link>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {currentIndex + 1} / {dueCards.length}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {currentChapterName.replace(/^\d+\.\s*/, '')}
              </span>
            </div>

            {/* TTS 控制 */}
            <div className="flex items-center gap-2">
              <Button
                variant={speaking ? "danger" : "ghost"}
                size="sm"
                onClick={toggleTTS}
                icon={speaking ? <X className="w-4 h-4" /> : (ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />)}
              >
                {speaking ? '停止' : (ttsEnabled ? '播报中' : '静音')}
              </Button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 卡片区域 */}
        <AnimatePresence mode="wait">
          {currentCard && (
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StudyCard
                card={currentCard}
                onRate={handleRate}
                onSpeak={handleSpeak}
                ttsEnabled={ttsEnabled}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部操作区 */}
        <div className="mt-8 flex justify-center gap-4">
          {currentIndex > 0 && (
            <Button
              variant="secondary"
              onClick={() => setCurrentIndex(prev => prev - 1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              上一张
            </Button>
          )}
          {currentIndex < dueCards.length - 1 && (
            <Button
              variant="secondary"
              onClick={() => setCurrentIndex(prev => prev + 1)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              下一张
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 章节侧边栏组件
function ChapterSidebar({
  chapters,
  selectedChapter,
  onSelectChapter,
  showSidebar,
  onToggleSidebar,
  currentCard
}: {
  chapters: { name: string; cards: FlashCard[] }[];
  selectedChapter: string | null;
  onSelectChapter: (chapter: string | null) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  currentCard: FlashCard | null;
}) {
  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className={`
        hidden md:block w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
        transition-all duration-300 overflow-y-auto h-screen sticky top-0
        ${showSidebar ? 'translate-x-0' : '-translate-x-full w-0 border-0'}
      `}>
        <div className="p-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
            选择章节
          </h3>

          {/* 全部选项 */}
          <button
            onClick={() => onSelectChapter(null)}
            className={`
              w-full flex items-center justify-between p-3 rounded-xl mb-2 transition-colors
              ${selectedChapter === null
                ? 'bg-blue-500 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }
            `}
          >
            <span className="font-medium">全部章节</span>
          </button>

          {/* 章节列表 */}
          <div className="space-y-2">
            {chapters.map((chapter) => (
              <button
                key={chapter.name}
                onClick={() => onSelectChapter(chapter.name)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-xl transition-colors
                  ${selectedChapter === chapter.name
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }
                `}
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate text-sm">
                    {chapter.name.replace(/^\d+\.\s*/, '')}
                  </p>
                  <p className={`text-xs ${selectedChapter === chapter.name ? 'text-blue-100' : 'text-slate-500'}`}>
                    {chapter.cards.length} 张
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* 移动端侧边栏切换按钮 */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-white dark:bg-slate-800 rounded-r-xl shadow-lg"
      >
        <ChevronLeft className={`w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
      </button>
    </>
  );
}