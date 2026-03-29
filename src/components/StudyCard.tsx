'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlashCard } from '@/lib/types';
import { formatDate, getMemoryStatus } from '@/lib/srs';
import { Button } from './Button';
import { Volume2, ChevronRight, Clock, Tag } from 'lucide-react';

/**
 * 格式化 Markdown 文本为美观的 HTML
 */
function formatMarkdown(text: string): string {
  if (!text) return '';

  let formatted = text;

  // 去除粗体标记 **text** -> text
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<span class="font-semibold">$1</span>');

  // 去除斜体标记 *text* -> text
  formatted = formatted.replace(/\*(.+?)\*/g, '$1');

  // 处理标题
  formatted = formatted.replace(/^#### (.+)$/gm, '<div class="font-semibold text-base mt-4 mb-2 text-slate-700 dark:text-slate-200">$1</div>');
  formatted = formatted.replace(/^### (.+)$/gm, '<div class="font-semibold text-lg mt-5 mb-3 text-slate-800 dark:text-slate-100">$1</div>');
  formatted = formatted.replace(/^## (.+)$/gm, '<div class="font-bold text-xl mt-5 mb-3 text-slate-800 dark:text-slate-100">$1</div>');

  // 处理列表
  const lines = formatted.split('\n');
  const result: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^(- |\d+\.\s*)(.+)$/);

    if (listMatch) {
      inList = true;
      const itemContent = listMatch[2].replace(/\*\*(.+?)\*\*/g, '<span class="font-semibold">$1</span>');
      listItems.push(`<li class="ml-4 mb-2 text-slate-700 dark:text-slate-300 leading-relaxed">${itemContent}</li>`);
    } else if (inList) {
      // 结束列表
      if (listItems.length > 0) {
        result.push(`<div class="my-4"><ul class="space-y-1">${listItems.join('')}</ul></div>`);
        listItems = [];
      }
      inList = false;
      // 添加普通段落
      if (trimmed) {
        result.push(`<p class="my-3 text-slate-700 dark:text-slate-300 leading-relaxed">${trimmed}</p>`);
      }
    } else if (trimmed) {
      // 检查是否是标题行（不以 - 或数字. 开头）
      if (!trimmed.startsWith('- ') && !/^\d+\.\s/.test(trimmed)) {
        result.push(`<p class="my-3 text-slate-700 dark:text-slate-300 leading-relaxed">${trimmed}</p>`);
      }
    }
  });

  // 处理剩余的列表
  if (listItems.length > 0) {
    result.push(`<div class="my-4"><ul class="space-y-1">${listItems.join('')}</ul></div>`);
  }

  return result.join('');
}

/**
 * 学习卡片组件属性
 */
interface StudyCardProps {
  card: FlashCard;
  onRate: (rating: number) => void;
  onSpeak?: (text: string) => void;
  ttsEnabled?: boolean;
}

/**
 * 翻转学习卡片组件
 */
export function StudyCard({ card, onRate, onSpeak, ttsEnabled }: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 监听键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isFlipped) {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        switch (e.key) {
          case '1':
            handleRate(0);
            break;
          case '2':
            handleRate(2);
            break;
          case '3':
            handleRate(4);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isAnimating]);

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleRate = (rating: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    onRate(rating);
    setTimeout(() => {
      setIsFlipped(false);
      setIsAnimating(false);
    }, 200);
  };

  const handleSpeak = () => {
    if (onSpeak) {
      const text = isFlipped ? card.back : card.front;
      // 去除 Markdown 格式
      const cleanText = text.replace(/\*\*/g, '').replace(/\n/g, ' ');
      onSpeak(cleanText);
    }
  };

  const memoryStatus = getMemoryStatus(card);

  return (
    <div className="w-full">
      {/* 卡片状态标签 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${memoryStatus.color}`}>
            {memoryStatus.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3 h-3" />
            下次: {formatDate(card.srs.next_review_date)}
          </span>
        </div>
        {ttsEnabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            icon={<Volume2 className="w-4 h-4" />}
          >
            朗读
          </Button>
        )}
      </div>

      {/* 翻转卡片 */}
      <div className="perspective-1000">
        <div className="relative w-full min-h-[450px]">
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              // 问题面
              <motion.div
                key="front"
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <CardFace
                  content={card.front}
                  chapter={card.chapter}
                  section={card.section}
                  tags={card.tags}
                  isQuestion={true}
                  onFlip={handleFlip}
                />
              </motion.div>
            ) : (
              // 答案面
              <motion.div
                key="back"
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={{ rotateX: -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <CardFace
                  content={card.back}
                  chapter={card.chapter}
                  section={card.section}
                  tags={card.tags}
                  isQuestion={false}
                  onFlip={() => setIsFlipped(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="mt-6">
        {!isFlipped ? (
          <div className="text-center">
            <Button
              onClick={handleFlip}
              size="lg"
              icon={<ChevronRight className="w-5 h-5" />}
            >
              显示答案
            </Button>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              按 <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">空格键</kbd> 快速显示
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
              记得如何？选择你的答案：
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <RatingButton
                rating={0}
                label="完全忘记"
                subLabel="1"
                color="red"
                onClick={() => handleRate(0)}
              />
              <RatingButton
                rating={2}
                label="有点印象"
                subLabel="2"
                color="orange"
                onClick={() => handleRate(2)}
              />
              <RatingButton
                rating={4}
                label="记住啦"
                subLabel="3"
                color="green"
                onClick={() => handleRate(4)}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * 卡片正面/背面
 */
function CardFace({
  content,
  section,
  tags,
  isQuestion,
  onFlip
}: {
  content: string;
  chapter: string;
  section: string;
  tags: string[];
  isQuestion: boolean;
  onFlip: () => void;
}) {
  // 格式化内容
  const formattedContent = isQuestion ? content : formatMarkdown(content);

  return (
    <div
      onClick={onFlip}
      className={`
        w-full h-full min-h-[450px] p-6 rounded-3xl cursor-pointer
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50
        hover:shadow-2xl hover:shadow-blue-500/10
        transition-all duration-300
        flex flex-col overflow-hidden
      `}
    >
      {/* 章节信息 */}
      <div className="mb-4 flex-shrink-0">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          {section}
        </p>
      </div>

      {/* 题目/答案内容 */}
      <div className="flex-1 overflow-y-auto">
        {isQuestion ? (
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-semibold leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
              {content}
            </h3>
          </div>
        ) : (
          <div
            className="text-sm leading-loose text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        )}
      </div>

      {/* 标签 */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-600 rounded-lg text-xs text-slate-600 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 提示 */}
      {isQuestion && (
        <p className="mt-4 text-center text-sm text-slate-400 flex-shrink-0">
          点击显示答案
        </p>
      )}
    </div>
  );
}

/**
 * 评分按钮
 */
function RatingButton({
  rating,
  label,
  subLabel,
  color,
  onClick
}: {
  rating: number;
  label: string;
  subLabel: string;
  color: 'red' | 'orange' | 'green';
  onClick: () => void;
}) {
  const colorStyles = {
    red: 'bg-red-500 hover:bg-red-600 shadow-red-500/25 hover:shadow-red-500/40',
    orange: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25 hover:shadow-amber-500/40',
    green: 'bg-green-500 hover:bg-green-600 shadow-green-500/25 hover:shadow-green-500/40'
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        px-6 py-3 rounded-xl font-medium text-white shadow-lg
        ${colorStyles[color]}
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500
      `}
    >
      <span className="flex flex-col items-center gap-1">
        <span>{label}</span>
        <kbd className="px-2 py-0.5 bg-white/20 rounded text-xs">{subLabel}</kbd>
      </span>
    </motion.button>
  );
}