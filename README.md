# Double's Blog

个人博客 + 共享剪贴板，部署在 Vercel 上。

## 功能

- **博客首页** `/` - 全屏 Banner + 内容卡片导航
- **日常小记** `/daily` - 生活随笔
- **碎片感受** `/thoughts` - 片刻感悟
- **共享剪贴板** `/clipboard` - 创建房间，粘贴即分享文字和图片

## 部署到 Vercel

### 1. 准备 Upstash Redis（共享剪贴板功能需要）

1. 访问 [console.upstash.com](https://console.upstash.com)，创建免费账号
2. 创建一个 Redis 数据库
3. 复制 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`

### 2. 部署

1. 在 [vercel.com](https://vercel.com) 导入此 GitHub 仓库
2. 在 Environment Variables 中添加：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. 点击 Deploy

### 3. 绑定域名 suno-fashion.com

在 Vercel 项目 → Settings → Domains 添加域名，然后设置 DNS：
- **A 记录**: `@` → `76.76.21.21`
- **CNAME**: `www` → `cname.vercel-dns.com`

## 本地开发

```bash
cp .env.example .env.local
# 编辑 .env.local 填入 Redis 凭证
npm install
npm run dev
```

## 技术栈

Next.js 14 · TypeScript · Tailwind CSS · Upstash Redis
