# Vibe Basic Deepseek Web

练习基础 LLM API 调用。Next.js + Supabase。

## 本地环境变量

复制 `.env.example` 为 `.env`，并设置：

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

本地 Supabase 默认地址为 `http://127.0.0.1:54321`。通过 Supabase CLI
启动本地服务后，可在 Mailpit 中查收注册确认邮件。

## 托管 Supabase 配置

在正式环境的 Authentication 设置中：

1. 开启 Confirm Email，并将最短密码长度设为 8。
2. 将 Site URL 设置为正式站点地址，并配置精确的 Redirect URLs。
3. 将 Confirm signup 邮件模板的确认链接替换为：

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

4. 上线前配置自定义 SMTP。
