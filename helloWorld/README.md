# ClipBoard Room - 剪贴板共享房间

无需登录，创建房间即可与他人共享文字和图片。粘贴即分享，简单高效。

## 功能

- 📎 **粘贴分享** - 支持 Ctrl+V 粘贴文字和图片，拖拽上传图片
- 🔒 **口令保护** - 可为房间设置密码，保护隐私
- ⚡ **实时同步** - 内容每 3 秒自动刷新
- 🚪 **房间管理** - 可创建、加入、删除房间
- 💬 **留言功能** - 在房间内发送文字消息
- 📱 **响应式设计** - 支持手机和桌面端

## 部署到 Vercel

### 1. 准备 Upstash Redis

1. 访问 [console.upstash.com](https://console.upstash.com)，创建免费账号
2. 创建一个 Redis 数据库（选择离你最近的区域）
3. 复制 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`

### 2. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 [vercel.com](https://vercel.com) 导入项目
3. **Root Directory** 设置为 `helloWorld`
4. 在 Environment Variables 中添加：
   - `UPSTASH_REDIS_REST_URL` = 你的 Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN` = 你的 Redis REST Token
5. 点击 Deploy

### 3. 绑定域名

1. 在 Vercel 项目设置 → Domains 中添加 `suno-fashion.com`
2. 在你的域名注册商设置 DNS：
   - **A 记录**: `@` → `76.76.21.21`
   - **CNAME 记录**: `www` → `cname.vercel-dns.com`

## 本地开发

```bash
cd helloWorld
cp .env.example .env.local
# 编辑 .env.local 填入 Upstash Redis 凭证
npm install
npm run dev
```

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Upstash Redis
