'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, TrendingUp, Clock, Target, Trophy, Flame, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getCardsAsync, getStudyHistory, getTodayStats, getWeekStats, getStreakDays, getUpcomingReviews } from '@/lib/storage';
import { getStudyStats } from '@/lib/srs';
import { FlashCard } from '@/lib/types';
import { APP_VERSION } from '@/config/version';

export default function StatsPage() {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [history, setHistory] = useState<{ records: any[]; dailyStats: any[]; streakDays: number; lastStudyDate: string }>({
    records: [],
    dailyStats: [],
    streakDays: 0,
    lastStudyDate: ''
  });
  const [stats, setStats] = useState({ totalCards: 0, masteredCards: 0, learningCards: 0, dueCards: 0, masteredRate: 0 });
  const [todayStudy, setTodayStudy] = useState({ studied: 0, remembered: 0, forgot: 0 });
  const [weekStudy, setWeekStudy] = useState({ studied: 0, days: 0, average: 0 });
  const [streakDays, setStreakDays] = useState(0);
  const [upcomingReviews, setUpcomingReviews] = useState<FlashCard[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  useEffect(() => {
    getCardsAsync().then(allCards => {
      setCards(allCards);
      setStats(getStudyStats(allCards));
      setUpcomingReviews(getUpcomingReviews(allCards));

      // 计算本月每天的学习统计
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthStats: any[] = [];

      for (let d = new Date(monthStart); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfMonth = d.getDate();
        const dayName = d.toLocaleDateString('zh-CN', { weekday: 'short' });

        // 该日期需要复习的卡片数
        const reviewCount = allCards.filter(card => {
          const reviewDate = new Date(card.srs.next_review_date);
          return reviewDate.toISOString().split('T')[0] === dateStr;
        }).length;

        monthStats.push({
          date: dateStr,
          day: dayOfMonth,
          dayName,
          reviewCount,
          isToday: dateStr === now.toISOString().split('T')[0]
        });
      }
      setMonthlyStats(monthStats);
    });

    setHistory(getStudyHistory());
    setTodayStudy(getTodayStats());
    setWeekStudy(getWeekStats());
    setStreakDays(getStreakDays());
  }, []);

  // 计算记忆效率
  const memoryRate = todayStudy.studied > 0
    ? Math.round((todayStudy.remembered / todayStudy.studied) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">学习统计</h1>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-slate-500">连续学习</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{streakDays} 天</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-500">今日已学</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{todayStudy.studied} 张</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm text-slate-500">记忆效率</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{memoryRate}%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-500">本周学习</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{weekStudy.studied} 张</p>
          </motion.div>
        </div>

        {/* 本月复习日历 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">本月复习日历</h2>
          <div className="grid grid-cols-7 md:grid-cols-31 gap-1">
            {monthlyStats.map((day) => (
              <div
                key={day.date}
                className={`
                  aspect-square rounded flex flex-col items-center justify-center text-xs
                  ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                  ${day.reviewCount === 0 ? 'bg-slate-100 dark:bg-slate-700' :
                    day.reviewCount < 5 ? 'bg-blue-100 dark:bg-blue-900/50' :
                    day.reviewCount < 15 ? 'bg-blue-200 dark:bg-blue-800/50' :
                    'bg-blue-300 dark:bg-blue-700/50'}
                `}
                title={`${day.dayName} ${day.day}日: ${day.reviewCount} 张待复习`}
              >
                <span className={day.isToday ? 'font-bold text-blue-600' : 'text-slate-600 dark:text-slate-400'}>
                  {day.day}
                </span>
                {day.reviewCount > 0 && (
                  <span className="text-[8px] text-slate-500">{day.reviewCount}</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span>少</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/50 rounded" />
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800/50 rounded" />
              <div className="w-4 h-4 bg-blue-300 dark:bg-blue-700/50 rounded" />
            </div>
            <span>多</span>
          </div>
        </motion.div>

        {/* 遗忘曲线提醒 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">即将遗忘的卡片</h2>
          {upcomingReviews.length === 0 ? (
            <p className="text-slate-500 text-center py-8">暂无即将需要复习的卡片</p>
          ) : (
            <div className="space-y-2">
              {upcomingReviews.slice(0, 10).map((card) => (
                <div key={card.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{card.topic}</p>
                    <p className="text-sm text-slate-500">{card.chapter}</p>
                  </div>
                  <Link
                    href="/study"
                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                  >
                    复习
                  </Link>
                </div>
              ))}
              {upcomingReviews.length > 10 && (
                <p className="text-center text-slate-500 text-sm">还有 {upcomingReviews.length - 10} 张即将复习...</p>
              )}
            </div>
          )}
        </motion.div>

        {/* 学习进度 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">学习进度</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">已掌握</span>
                <span className="text-slate-800 dark:text-slate-100">{stats.masteredCards} / {stats.totalCards}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.masteredRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 dark:text-slate-400">学习中</span>
                <span className="text-slate-800 dark:text-slate-100">{stats.learningCards} / {stats.totalCards}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${stats.totalCards > 0 ? (stats.learningCards / stats.totalCards) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* 版本信息 */}
        <p className="text-center text-sm text-slate-400 mt-8">
          智习学习系统 v{APP_VERSION}
        </p>
      </div>
    </div>
  );
}