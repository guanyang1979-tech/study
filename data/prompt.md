# 角色与核心任务
你是一个资深的前端架构师和全栈开发工程师。请帮我设计并编写一个基于 React (推荐使用 Next.js App Router) + Tailwind CSS 的个人高级经济师备考系统。
该系统的核心机制是基于艾宾浩斯遗忘曲线的间隔重复（Spaced Repetition），并且具备高度的自动化（Webhook 微信推送）、AI 辅助能力（TTS 语音播报）以及完整的知识库与附件管理功能。

因为我是个人开发者，在代码仓库管理和全栈部署方面还在学习阶段，请在提供代码时，务必保持代码结构清晰，多写中文注释，并提供小白友好的环境配置、GitHub 提交和 Vercel/本地部署指南。

# 核心技术栈建议
- 前端：Next.js (App Router), Tailwind CSS, Framer Motion (用于卡片平滑翻转等微动效)。
- 数据库/数据管理：初期 MVP 版本请使用本地 JSON 文件读写或 LocalStorage。预留好后续迁移到 Supabase 或 Firebase 的接口抽象层。
- 图标库：Lucide React 或类似极简图标库。

# UI/UX 设计规范
1. 整体风格参考 Google Material Design 3 规范和 ChatGPT Web 端。
2. 采用极简主义（Minimalist），大面积留白，突出核心复习内容。
3. 必须支持全局深色模式（Dark Mode 切换）。
4. 按钮和交互需要有科技感与现代感（Hover 发光、平滑过渡等）。

# 核心数据结构 (JSON Schema)
请在设计系统时，严格参考我现有的考点卡片数据结构：
```json
{
  "id": "ch1-sec1-001",
  "chapter": "第一章 企业职能与战略决策",
  "section": "第一节 企业与企业管理的职能",
  "topic": "企业管理的职能",
  "front": "企业管理的主要职能包括哪些内容？首要职能是什么？",
  "back": "1. **计划职能**：首要职能...（支持 Markdown 渲染）",
  "importance": 5,
  "tags": ["基础概念", "首要职能"],
  "practical_link": "实务思考：在日常管理中...",
  "attachments": ["/assets/ch1_mindmap.pdf", "/assets/page_12_screenshot.jpg"], // 关联的源文件路径
  "srs": {
    "repetition": 0,
    "interval": 0,
    "ease_factor": 2.5,
    "next_review_date": "2026-03-26T00:00:00Z"
  }
}