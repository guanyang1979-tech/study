'use client';

import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

type ThemeOption = 'light' | 'dark' | 'system';

/**
 * 主题切换组件 - 支持亮色/深色/跟随系统
 */
export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const themes: { value: ThemeOption; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: '浅色' },
    { value: 'dark', icon: Moon, label: '深色' },
    { value: 'system', icon: Monitor, label: '跟随系统' }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
      {themes.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300
            ${theme === value
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          <Icon className="w-4 h-4" />
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}

/**
 * 简单的深色模式指示器（用于移动端或快速切换）
 */
export function DarkModeIndicator() {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-amber-400" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
      </motion.div>
      <span className="text-sm text-slate-600 dark:text-slate-400">
        {isDark ? '深色模式' : '浅色模式'}
      </span>
    </div>
  );
}