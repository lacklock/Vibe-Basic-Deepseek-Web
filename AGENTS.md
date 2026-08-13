# AGENTS

这是一个 next.js web 项目。基础的大模型网页聊天应用。
如果需要使用图标、 UI组件，优先考虑使用 lucide 和 shadcn

## 技术栈

- vercel ai sdk
- 图标：lucide
- UI 组件库：shadcn
- ORM：drizzle
- 数据库：supabase

## Agent skills

### Issue tracker

问题以 Markdown 文件形式存放在本仓库的 `.scratch/<feature>/` 目录下。见 `docs/agents/issue-tracker.md`。

### Domain docs

单上下文（single-context）布局：根目录的 `CONTEXT.md` + `docs/adr/`。见 `docs/agents/domain.md`。

## 服务端鉴权

- `src/proxy.ts` 及 `src/lib/supabase/proxy.ts` 负责刷新 Supabase 会话、保护页面路由，并提前拒绝未登录的 API 请求；proxy 不是唯一的授权保障。
- 所有读取或修改用户数据的 Server Component、页面和 Server Action，必须在业务逻辑入口调用 `requireUser()`，从返回的 claims 获取 `sub`。不要在业务文件中重复调用 `createClient().auth.getClaims()`。
- 需要登录的 Route Handler 必须使用 `withAuthenticatedRoute()` 包装导出的处理函数；包装器统一校验 claims，并在登录失效时返回 `401` JSON 响应。
- 登录、注册、认证回调等公开入口可以不使用上述鉴权接口，但必须由 `src/lib/auth/routes.ts` 明确声明其公开路由属性。
- 身份认证不能代替资源授权。访问聊天、消息、用户资料等资源时，查询仍必须携带当前 `userId` 并检查资源所有权；数据库 RLS 作为最后一道保护保留。
- 如果新交互确实要求 Server Action 在登录失效时返回内联状态而不是跳转，不要重新散落 `getClaims()`；应在 `src/lib/auth/require-user.ts` 增加一个语义明确且有测试的统一接口。
