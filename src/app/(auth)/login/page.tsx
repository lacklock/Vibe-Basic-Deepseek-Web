import { AuthShell } from "../auth-shell";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <AuthShell
      title="欢迎回来"
      description="使用邮箱和密码登录，继续你的对话。"
      footerText="还没有账号？"
      footerLink="/register"
      footerLinkText="创建账号"
    >
      {error === "confirmation" && (
        <p
          role="alert"
          className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          验证链接无效或已过期，请重新注册或获取新的验证邮件。
        </p>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
