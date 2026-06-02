# 部署到公网 — 让所有人都能访问

本地地址（`localhost`、`studysummarizer`、局域网 IP）**只有你自己或同一 WiFi 的人**能打开。  
要让**全世界任何人**都能用，需要部署到 **Vercel**（免费）。

---

## 一、准备工作

1. 注册 [GitHub](https://github.com) 账号  
2. 注册 [Vercel](https://vercel.com) 账号（可用 GitHub 登录）  
3. 准备好三个 API Key（与 `.env.local` 相同）：
   - `DEEPSEEK_API_KEY`
   - `OCR_SPACE_API_KEY`

---

## 二、上传代码到 GitHub

在终端执行（在项目目录）：

```bash
cd "/Users/mac/Desktop/vibe coding"
git init
git add .
git commit -m "StudySummarizer initial release"
```

在 GitHub 网页新建仓库（例如 `study-summarizer`），然后：

```bash
git remote add origin https://github.com/你的用户名/study-summarizer.git
git branch -M main
git push -u origin main
```

---

## 三、在 Vercel 部署

1. 打开 [https://vercel.com/new](https://vercel.com/new)  
2. 选择 **Import Git Repository**，选中你的仓库  
3. **Root Directory** 保持默认（仓库根目录）  
4. 展开 **Environment Variables**，添加：

| 名称 | 值 |
|------|-----|
| `DEEPSEEK_API_KEY` | 你的 DeepSeek Key |
| `OCR_SPACE_API_KEY` | 你的 OCR.space Key |
| `OCR_LANGUAGE` | `auto`（可选） |

5. 点击 **Deploy**，等待约 2–3 分钟  
6. 完成后会得到公网地址，例如：  
   `https://study-summarizer-xxx.vercel.app`

**把这个链接发给任何人，他们都能打开并使用。**

---

## 四、可选：自定义域名

在 Vercel 项目 → **Settings** → **Domains** 可绑定自己的域名（如 `summarizer.yourschool.com`）。

---

## 五、常见问题

| 问题 | 原因 / 解决 |
|------|-------------|
| Connection failed | 本地服务未启动，或发错了 `studysummarizer` 链接 → 使用 Vercel 公网链接 |
| 上传 PDF 失败 | 文件超过 4MB（Vercel 限制）→ 压缩后重试 |
| 总结失败 | Vercel 未配置 `DEEPSEEK_API_KEY` → 在环境变量中补全并 Redeploy |
| OCR 失败 | 未配置 `OCR_SPACE_API_KEY` 或 OCR 超时 → 检查 Key，或换更小 PDF |

---

## 六、更新网站

改代码后推送到 GitHub，Vercel 会自动重新部署：

```bash
git add .
git commit -m "update"
git push
```

---

## 本地开发（仅自己测试）

```bash
npm install
npm run dev
```

打开 http://localhost:3000
