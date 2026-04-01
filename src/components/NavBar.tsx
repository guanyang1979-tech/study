'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, Settings, GraduationCap, BarChart3, ChevronDown, Plus, Trash2, Pencil } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { getSubjects, getCurrentSubject, setCurrentSubjectId, addSubject, deleteSubject, updateSubject } from '@/lib/storage';
import { Subject } from '@/lib/types';
import { useModal } from './Modal';

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/study', icon: GraduationCap, label: '学习' },
  { href: '/library', icon: Library, label: '知识库' },
  { href: '/stats', icon: BarChart3, label: '统计' },
  { href: '/settings', icon: Settings, label: '设置' }
];

/**
 * 导航栏组件
 */
export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo 区域 */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow duration-300"
              whileHover={{ rotate: 10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                智习
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">
                间隔重复学习系统
              </p>
            </div>
          </Link>

          {/* 学科选择器 */}
          <SubjectSelector />

          {/* 桌面端导航 */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300
                    ${isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 右侧区域 */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* 移动端菜单按钮 */}
            <MobileMenu pathname={pathname} />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * 移动端菜单
 */
function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 py-2 z-50">
      <nav className="flex items-center justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors duration-200
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * 学科选择器组件
 */
function SubjectSelector() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSubject, setCurrentSubjectLocal] = useState<Subject | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectDesc, setEditSubjectDesc] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { alert, confirm } = useModal();

  // 加载学科数据
  useEffect(() => {
    loadSubjects();
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
        setEditingSubjectId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSubjects = () => {
    const allSubjects = getSubjects();
    const current = getCurrentSubject();
    setSubjects(allSubjects);
    setCurrentSubjectLocal(current);
  };

  const handleSelectSubject = (subjectId: string) => {
    setCurrentSubjectId(subjectId);
    loadSubjects();
    setIsOpen(false);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;

    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addSubject(newSubjectName.trim(), newSubjectDesc.trim(), randomColor);
    setNewSubjectName('');
    setNewSubjectDesc('');
    setShowAddForm(false);
    loadSubjects();
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (subjects.length <= 1) {
      await alert('无法删除最后一个学科');
      return;
    }

    const ok = await confirm(`确定要删除学科"${subjectName}"吗？\n删除后该学科的所有卡片将无法恢复。`);
    if (ok) {
      deleteSubject(subjectId);
      // 如果删除的是当前学科，切换到第一个
      if (currentSubject?.id === subjectId && subjects.length > 1) {
        const remaining = subjects.filter(s => s.id !== subjectId);
        setCurrentSubjectId(remaining[0].id);
      }
      loadSubjects();
    }
  };

  // 开始编辑学科
  const handleStartEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setEditSubjectName(subject.name);
    setEditSubjectDesc(subject.description || '');
  };

  // 保存编辑
  const handleSaveEdit = (subjectId: string) => {
    if (!editSubjectName.trim()) return;
    updateSubject(subjectId, {
      name: editSubjectName.trim(),
      description: editSubjectDesc.trim()
    });
    setEditingSubjectId(null);
    loadSubjects();
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingSubjectId(null);
    setEditSubjectName('');
    setEditSubjectDesc('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 当前学科按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: currentSubject?.color || '#3B82F6' }}
        />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
          {currentSubject?.name || '默认学科'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
        >
          <div className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
            选择学科
          </div>

          {/* 学科列表 */}
          {subjects.map(subject => (
            <div
              key={subject.id}
              className={`px-3 py-2 mx-2 rounded-lg ${
                currentSubject?.id === subject.id
                  ? 'bg-blue-50 dark:bg-blue-900/30'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {editingSubjectId === subject.id ? (
                /* 编辑模式 */
                <div onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editSubjectName}
                    onChange={e => setEditSubjectName(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 mb-2"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="描述（可选）"
                    value={editSubjectDesc}
                    onChange={e => setEditSubjectDesc(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(subject.id)}
                      className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 px-2 py-1 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                /* 显示模式 */
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleSelectSubject(subject.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                      {subject.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(subject);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {subjects.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(subject.id, subject.name);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 添加新学科 */}
          {showAddForm ? (
            <div className="px-3 py-2 mt-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="学科名称"
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 mb-2"
                autoFocus
              />
              <input
                type="text"
                placeholder="描述（可选）"
                value={newSubjectDesc}
                onChange={e => setNewSubjectDesc(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSubject}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSubjectName('');
                    setNewSubjectDesc('');
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 w-full px-3 py-2 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-t border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-4 h-4" />
              添加新学科
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}