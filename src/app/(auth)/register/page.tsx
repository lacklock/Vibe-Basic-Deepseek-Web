import { AuthShell } from "../auth-shell";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="创建账号"
      description="注册后需要通过邮件验证你的邮箱。"
      footerText="已经有账号？"
      footerLink="/login"
      footerLinkText="返回登录"
    >
      <RegisterForm />
    </AuthShell>
  );
}
