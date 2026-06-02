# StudySummarizer — AI 学习资料总结网站

面向学生的 AI 文档/文章总结工具。粘贴阅读材料或上传文本文件，自动提取摘要、要点、关键词和通俗解释。

## 功能

- **Summary** — 文章主要内容总结
- **Bullet Points** — 重点要点列表
- **Keywords** — 关键词提取
- **Simple Explanation** — 通俗易懂的解释（可选，适合学生理解）
- 支持粘贴文本或上传 `.txt` / `.md` / `.pdf` / `.doc` / `.docx` 文件
- PDF、Word 文档自动提取文字；**扫描版 PDF 使用 OCR.space 云端 OCR**
- 支持 **拖拽上传** 文件
- 总结结果可一键切换 **中文 / English**
- 一键复制单个板块或全部结果

## 技术栈

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [DeepSeek API](https://platform.deepseek.com/)（默认，deepseek-chat）
- 也支持 [OpenAI API](https://platform.openai.com/) 作为备选

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 DeepSeek API Key 和 OCR.space API Key：

```
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
OCR_SPACE_API_KEY=your-ocr-space-key-here
```

> DeepSeek Key：[DeepSeek 开放平台](https://platform.deepseek.com/api_keys)  
> OCR Key（免费）：[OCR.space 免费 Key](https://ocr.space/ocrapi/freekey)（扫描版 PDF 必需）

### 3. 配置本地域名（一次性）

```bash
npm run setup:hosts
```

按提示输入 Mac 密码，将 `studysummarizer` 指向本机。

### 4. 启动开发服务器

```bash
sudo npm run dev
```

> 使用 80 端口需要 `sudo`。若不想用 sudo，可运行 `npm run dev:3000`，然后访问 http://studysummarizer:3000

打开 **[http://studysummarizer](http://studysummarizer)** 即可使用。

### 分享给其他同学？

| 链接 | 谁能访问 |
|------|----------|
| `http://studysummarizer` | **仅你自己**（本机 hosts 配置） |
| `http://你的局域网IP`（页面底部黄色提示框） | **同一 WiFi** 下的同学 |
| 部署到 Vercel 等平台的公网地址 | **互联网上任何人** |

> 不要把 `studysummarizer` 发给他人，对方电脑上没有这个域名会打不开或报错。

### 5. 生产构建

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── api/summarize/route.ts   # AI 总结 API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── SummarizerApp.tsx        # 主界面（输入 + 选项）
│   └── ResultPanel.tsx          # 结果展示
└── lib/
    ├── ai-client.ts             # AI 客户端（DeepSeek / OpenAI）
    ├── summarize.ts             # 总结逻辑
    └── types.ts                 # 类型定义 & 校验
```

## 后续可扩展

- [ ] 扫描版 PDF OCR 进度条（逐页显示）
- [ ] 总结历史记录
- [ ] 导出为 PDF / Markdown
- [ ] 多语言界面
- [ ] 用户账号与云端保存

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 推荐 | DeepSeek API 密钥（文章总结） |
| `DEEPSEEK_MODEL` | 否 | 总结模型，默认 `deepseek-chat` |
| `OCR_SPACE_API_KEY` | 扫描版 PDF 必需 | OCR.space 免费 API Key |
| `OCR_LANGUAGE` | 否 | OCR 语言，默认 `chs`（简体中文） |
| `OPENAI_API_KEY` | 备选 | 未配置 DeepSeek 时使用 OpenAI 总结 |
| `OPENAI_MODEL` | 否 | OpenAI 模型，默认 `gpt-4o-mini` |

## License

MIT
