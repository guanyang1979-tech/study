'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
}

/**
 * 统计卡片组件 - 用于显示学习统计数据
 */
export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
  className = ''
}: StatsCardProps) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      iconBg: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      trend: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950',
      iconBg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      trend: 'text-green-600 dark:text-green-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      iconBg: 'bg-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      trend: 'text-purple-600 dark:text-purple-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      iconBg: 'bg-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      trend: 'text-orange-600 dark:text-orange-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950',
      iconBg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      trend: 'text-red-600 dark:text-red-400'
    }
  };

  const colors = colorStyles[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden rounded-2xl p-6 ${colors.bg} border border-slate-100 dark:border-slate-800
        hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
        transition-all duration-300 ${className}
      `}
    >
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-current to-transparent" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </span>
          {icon && (
            <div className={`p-2 rounded-xl ${colors.iconBg} bg-opacity-20`}>
              <span className={`${colors.text}`}>{icon}</span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-3">
          <motion.span
            className={`text-4xl font-bold ${colors.text}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.span>

          {trend && trendValue && (
            <div className={`flex items-center gap-1 mb-1 ${colors.trend}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>

        {subtitle && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}