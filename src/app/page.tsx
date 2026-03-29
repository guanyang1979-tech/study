'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Clock, Trophy, ArrowRight, Sparkles, Target } from 'lucide-react';
import { getCardsAsync } from '@/lib/storage';
import { getDueCards, getStudyStats } from '@/lib/srs';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/Button';
import { FlashCard } from '@/lib/types';

export default function HomePage() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [stats, setStats] = useState({
    totalCards: 0,
    masteredCards: 0,
    learningCards: 0,
    dueCards: 0,
    masteredRate: 0
  });

  useEffect(() => {
    getCardsAsync().then(allCards => {
      setCards(allCards);
      setStats(getStudyStats(allCards));
    });
  }, []);

  const dueCards = getDueCards(cards);

  // 获取最近学习的章节
  const chapters = [...new Set(cards.map(c => c.chapter))];

  return (
    <div className="min-h-screen bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* 欢迎区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 md:p-12 text-white">
            {/* 背景装饰 */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <span className="text-blue-100 font-medium">欢迎回来</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                准备好了吗？<br />
                让我们继续学习
              </h1>
              <p className="text-blue-100 text-lg max-w-xl mb-8">
                每天坚持复习，利用间隔重复科学记忆，轻松掌握高级经济师知识点
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/study">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl shadow-blue-900/20"
                    icon={<GraduationCap className="w-5 h-5" />}
                  >
                    {dueCards.length > 0 ? `开始复习 (${dueCards.length} 张)` : '开始学习'}
                  </Button>
                </Link>
                <Link href="/library">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                    icon={<BookOpen className="w-5 h-5" />}
                  >
                    查看知识库
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="今日待复习"
            value={stats.dueCards}
            color="blue"
            icon={<Clock className="w-5 h-5" />}
            subtitle={stats.dueCards > 0 ? '点击开始复习' : '太棒了！'}
          />
          <StatsCard
            title="总卡片数"
            value={stats.totalCards}
            color="purple"
            icon={<BookOpen className="w-5 h-5" />}
            subtitle="已导入知识"
          />
          <StatsCard
            title="学习中"
            value={stats.learningCards}
            color="orange"
            icon={<Target className="w-5 h-5" />}
            subtitle="持续巩固"
          />
          <StatsCard
            title="已掌握"
            value={stats.masteredCards}
            color="green"
            icon={<Trophy className="w-5 h-5" />}
            subtitle={`${stats.masteredRate}% 掌握率`}
          />
        </div>

        {/* 快速访问区域 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 今日任务 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                今日任务
              </h2>
              <Link
                href="/study"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                立即开始 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {dueCards.length > 0 ? (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {dueCards.length} 张卡片待复习
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        预计用时：{Math.ceil(dueCards.length * 2)} 分钟
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  复习完成后再学习新内容，效果更好
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  太棒了！今天的学习任务已完成
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  明天再来复习，记得保持连续学习
                </p>
              </div>
            )}
          </motion.div>

          {/* 知识库概览 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                知识库
              </h2>
              <Link
                href="/library"
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {chapters.slice(0, 3).map((chapter, index) => {
                const chapterCards = cards.filter(c => c.chapter === chapter);
                return (
                  <Link
                    key={index}
                    href="/library"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {chapter.replace(/^\d+\.\s*/, '')}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {chapterCards.length} 张
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* 学习提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-6 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                学习小贴士
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                使用间隔重复学习法，建议每天复习 20-30 张卡片。根据艾宾浩斯遗忘曲线，
                在即将遗忘时复习可以最大程度巩固记忆。保持连续学习，养成好习惯！
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}