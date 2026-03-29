'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Volume2, Bell, Database, Trash2, Download, Upload, Sparkles, X, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useModal } from '@/components/Modal';
import { getSettingsAsync, saveSettings, exportData, importData, resetData } from '@/lib/storage';
import { Button } from '@/components/Button';
import { AppSettings } from '@/lib/types';

/**
 * 可用的中文语音列表 - 映射到可用的系统语音
 */
const VOICES = [
  { name: '中文（简体）默认', lang: 'zh-CN', voiceName: 'Microsoft Yaoyao' },
  { name: '中文（简体）晓伊', lang: 'zh-CN', voiceName: 'Microsoft Yaoyao' },
  { name: '中文（简体）晓晓', lang: 'zh-CN', voiceName: 'Microsoft Yaoyao' },
  { name: '中文（台湾）思婷', lang: 'zh-TW', voiceName: 'Microsoft Zheng Ting' },
  { name: '中文（香港）希蒂', lang: 'zh-HK', voiceName: 'Microsoft Hei' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { alert, confirm } = useModal();
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    ttsEnabled: false,
    ttsSpeed: 1.0,
    ttsVoice: 'zh-CN',
    webhookUrl: '',
    webhookEnabled: false
  });
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    getSettingsAsync().then(loadedSettings => {
      setSettings(loadedSettings);
    });
  }, []);

  // 保存设置
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveSettings(updated);
  };

  // 测试 TTS
  const testTTS = () => {
    if (!settings.ttsEnabled) {
      updateSettings({ ttsEnabled: true });
      return;
    }

    // 停止当前播放
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const testText = '这是一段测试语音，正在播放智习学习系统的语音功能。';
    const utterance = new SpeechSynthesisUtterance(testText);

    // 尝试找到匹配的语音
    const voices = window.speechSynthesis.getVoices();
    const selectedVoiceConfig = VOICES.find(v => v.lang === settings.ttsVoice);

    if (selectedVoiceConfig && voices.length > 0) {
      // 尝试找到指定语音，如果没有则使用第一个可用的中文语音
      const matchedVoice = voices.find(v =>
        v.lang === settings.ttsVoice &&
        (v.name.includes(selectedVoiceConfig.voiceName.split(' ')[1] || '') ||
         v.name.includes('Chinese') ||
         v.name.includes('中文'))
      ) || voices.find(v => v.lang === settings.ttsVoice);

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.lang = settings.ttsVoice || 'zh-CN';
    utterance.rate = settings.ttsSpeed;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 停止语音
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // 导出数据
  const handleExport = () => {
    exportData();
  };

  // 导入数据
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importData(file);
        await alert('导入成功！');
      } catch {
        await alert('导入失败，请检查文件格式', 'alert');
      }
    }
  };

  // 重置数据
  const handleReset = async () => {
    const firstConfirm = await confirm('确定要重置所有学习数据吗？此操作不可恢复！');
    if (firstConfirm) {
      const secondConfirm = await confirm('再次确认：将会清除所有学习进度，确定继续？');
      if (secondConfirm) {
        resetData();
        await alert('数据已重置');
        window.location.reload();
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">
        设置
      </h1>

      <div className="space-y-8">
        {/* 外观设置 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">外观</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">自定义应用外观</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                主题模式
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'light', icon: Sun, label: '浅色' },
                  { value: 'dark', icon: Moon, label: '深色' },
                  { value: 'system', icon: Monitor, label: '跟随系统' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value as 'light' | 'dark' | 'system')}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all
                      ${theme === value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI 语音设置 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">AI 语音</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">语音播报功能设置</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 语音开关 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">开启语音播报</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">学习时自动朗读卡片内容</p>
              </div>
              <button
                onClick={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}
                className={`
                  relative w-14 h-8 rounded-full transition-colors duration-300
                  ${settings.ttsEnabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}
                `}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ left: settings.ttsEnabled ? '1.5rem' : '0.25rem' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {settings.ttsEnabled && (
              <>
                {/* 语音选择 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    选择音色
                  </label>
                  <select
                    value={settings.ttsVoice || 'zh-CN'}
                    onChange={(e) => updateSettings({ ttsVoice: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                  >
                    {VOICES.map((voice) => (
                      <option key={voice.lang} value={voice.lang}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 语速 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-700 dark:text-slate-200">语速</p>
                    <span className="text-sm text-slate-500">{settings.ttsSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={settings.ttsSpeed}
                    onChange={(e) => updateSettings({ ttsSpeed: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* 测试按钮 */}
                <div className="flex gap-3">
                  <Button
                    variant={speaking ? "danger" : "secondary"}
                    onClick={testTTS}
                    icon={speaking ? <X className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  >
                    {speaking ? '停止播放' : '测试语音'}
                  </Button>
                  {speaking && (
                    <Button
                      variant="ghost"
                      onClick={stopSpeaking}
                      icon={<X className="w-4 h-4" />}
                    >
                      停止
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* 推送设置 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">推送通知</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Webhook 推送设置</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">启用推送</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">通过 Webhook 推送复习提醒</p>
              </div>
              <button
                onClick={() => updateSettings({ webhookEnabled: !settings.webhookEnabled })}
                className={`
                  relative w-14 h-8 rounded-full transition-colors duration-300
                  ${settings.webhookEnabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}
                `}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ left: settings.webhookEnabled ? '1.5rem' : '0.25rem' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {settings.webhookEnabled && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={settings.webhookUrl}
                  onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
                  placeholder="https://your-webhook-url.com/notify"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            )}
          </div>
        </section>

        {/* 数据管理 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">数据管理</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">导入导出和重置数据</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={handleExport}
                icon={<Download className="w-4 h-4" />}
              >
                导出数据
              </Button>

              <label>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                <span className="inline-flex cursor-pointer">
                  <Button
                    variant="secondary"
                    icon={<Upload className="w-4 h-4" />}
                  >
                    导入数据
                  </Button>
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                危险操作：重置将清除所有学习进度，此操作不可恢复！
              </p>
              <Button
                variant="danger"
                onClick={handleReset}
                icon={<Trash2 className="w-4 h-4" />}
              >
                重置所有数据
              </Button>
            </div>
          </div>
        </section>

        {/* 关于 */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">关于智习</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">间隔重复学习系统</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>版本：1.0.0</p>
            <p>基于艾宾浩斯遗忘曲线科学记忆</p>
            <p>帮助备考高级经济师高效复习</p>
          </div>
        </section>

        {/* 使用说明 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 rounded-xl">
              <HelpCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">使用说明</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">功能操作指南</p>
            </div>
          </div>

          <div className="space-y-4">
            <HelpItem
              title="首页概览"
              content="首页显示今日待复习卡片数量、连续学习天数、学习进度统计。点击「开始学习」进入复习页面。"
            />

            <HelpItem
              title="学习流程"
              content="1. 在学习页面，系统会按艾宾浩斯遗忘曲线安排需要复习的卡片。2. 点击卡片显示答案。3. 根据记忆情况选择「完全忘记」「有点印象」或「记住啦」。4. 系统会自动安排下次复习时间。"
            />

            <HelpItem
              title="章节学习"
              content="学习页面左侧有章节侧边栏，可以选择特定章节进行针对性复习。点击章节名称即可切换。"
            />

            <HelpItem
              title="知识库"
              content="知识库页面提供两种视图：列表视图（默认）显示所有卡片内容和答案预览；章节视图按章节分组展示。点击任意卡片可查看详情。"
            />

            <HelpItem
              title="搜索功能"
              content="知识库支持全文搜索，可搜索问题、答案、章节名称、标签等内容。输入关键词即可实时过滤。"
            />

            <HelpItem
              title="语音播报"
              content="在设置中开启「语音播报」功能后，学习时点击卡片上的「朗读」按钮或使用顶部的播报按钮，系统会用语音朗读卡片内容。可选择不同音色和语速。"
            />

            <HelpItem
              title="推送提醒"
              content="1. 在设置中开启「启用推送」开关。2. 配置 Webhook URL（需要支持 POST 请求的服务）。3. 当有卡片到期需要复习时，系统会向指定的 URL 发送提醒通知。"
            />

            <HelpItem
              title="Webhook 配置说明"
              content={`Webhook 功能需要配置一个可接收 POST 请求的 URL 地址。系统会在有复习任务时发送 JSON 格式的请求，示例格式：
{
  "title": "智习提醒",
  "message": "您有 X 张卡片需要复习",
  "cards": [...]
}
常用场景：企业微信机器人、钉钉机器人、飞书机器人、IFTTT 等。`}
            />

            <HelpItem
              title="数据导入导出"
              content="支持导入/导出 JSON 格式的卡片数据。导出数据会包含所有卡片和学习进度，方便备份或迁移。"/>
            <HelpItem
              title="主题切换"
              content="支持浅色、深色、跟随系统三种主题模式。可在设置页面的「外观」部分进行切换。"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

// 帮助文档项组件
function HelpItem({ title, content }: { title: string; content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-medium text-slate-700 dark:text-slate-200">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}