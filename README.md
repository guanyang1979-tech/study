# 智习 - 间隔重复学习系统

基于艾宾浩斯遗忘曲线的间隔重复学习系统，帮助高效备考高级经济师。

## 功能特性

- 📚 **知识库管理**：导入/导出卡片，按章节分类
- 🧠 **间隔重复**：基于 SM-2 算法的智能复习计划
- 🌙 **深色模式**：支持亮色/深色/跟随系统
- 🔊 **AI 语音播报**：TTS 语音朗读卡片内容
- 📱 **响应式设计**：支持移动端和桌面端
- 💾 **数据持久化**：LocalStorage 本地存储

## 技术栈

- **框架**：Next.js 14 (App Router)
- **样式**：Tailwind CSS
- **动画**：Framer Motion
- **图标**：Lucide React
- **部署**：Vercel

## 快速开始

### 本地开发

```bash
# 1. 进入项目目录
cd study

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [Vercel](https://vercel.com) 并登录
3. 点击 "New Project" 导入 GitHub 仓库
4. 配置完成后点击 "Deploy"

## 项目结构

```
study/
├── src/
│   ├── app/                    # Next.js 页面
│   │   ├── page.tsx            # 首页
│   │   ├── study/             # 学习页面
│   │   ├── library/           # 知识库页面
│   │   └── settings/          # 设置页面
│   ├── components/             # React 组件
│   │   ├── Button.tsx          # 按钮组件
│   │   ├── NavBar.tsx          # 导航栏
│   │   ├── StatsCard.tsx       # 统计卡片
│   │   ├── StudyCard.tsx       # 学习卡片
│   │   └── ThemeToggle.tsx     # 主题切换
│   ├── contexts/               # React Context
│   │   └── ThemeContext.tsx    # 主题上下文
│   ├── data/                   # 数据文件
│   │   └── cards.ts            # 初始卡片数据
│   └── lib/                    # 工具函数
│       ├── types.ts            # 类型定义
│       ├── srs.ts              # 间隔重复算法
│       └── storage.ts          # 数据存储
├── SPEC.md                     # 项目规格文档
└── package.json
```

## 使用指南

### 首页
- 查看今日待复习卡片数量
- 快速开始学习
- 查看学习统计

### 学习页面
- 点击卡片显示答案
- 评分：完全忘记(1) / 有点印象(2) / 记住啦(3)
- 支持键盘快捷键（空格显示答案，1-3 评分）

### 知识库
- 浏览所有卡片
- 按章节筛选
- 搜索卡片
- 导入/导出数据

### 设置
- 切换主题模式
- 开启/关闭 TTS 语音播报
- 配置 Webhook 推送
- 管理数据

## 间隔重复算法说明

采用 SM-2 改进版算法：
- 首次复习间隔 1 天
- 第二次复习间隔 6 天
- 后续复习：间隔 = 上次间隔 × 难度因子
- 评分低于 3 分重置学习进度
- 难度因子最小值为 1.3

## 数据存储

- 学习进度存储在浏览器 LocalStorage
- 支持导出为 JSON 文件备份
- 支持从 JSON 文件导入数据

## 注意事项

1. 首次使用会自动加载预设的知识点卡片
2. 学习数据保存在浏览器本地，清除浏览器数据会丢失
3. 建议定期导出备份数据
4. Webhook 功能需要自建服务器接收推送

## 许可证

MIT License