# Dev log

## 初始化项目

环境：Node.js、 PNPM

安装 [Next.js](https://nextjs.org/docs) ：`pnpm create next-app@latest .`

### Supabase

`pnpm install @supabase/supabase-js @supabase/ssr`

#### 本地 Supabase [可选]

本地需有 docker 环境。
安装 Supabase CLI：`pnpm add -D supabase`

启动环境：`pnpm supabase start`

### 安装 [drizzle](https://orm.drizzle.team/docs/get-started/supabase-new)

```bash
pnpm add drizzle-orm@rc postgres dotenv
pnpm add -D drizzle-kit@rc tsx
```

## Auth

[Password-based Auth 基于密码的身份验证](https://supabase.com/docs/guides/auth/passwords?queryGroups=flow&flow=pkce)
