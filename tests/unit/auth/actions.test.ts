import assert from "node:assert/strict";
import test, { before, mock } from "node:test";

const revalidatePath = mock.fn();

class RedirectError extends Error {
  constructor(readonly path: string) {
    super(`Redirected to ${path}`);
  }
}

const redirect = mock.fn((path: string): never => {
  throw new RedirectError(path);
});
const signInWithPassword = mock.fn(async () => ({ error: null }));
const signUp = mock.fn(async () => ({ error: null }));

mock.module("next/cache", {
  namedExports: { revalidatePath },
});
mock.module("next/navigation", {
  namedExports: { redirect },
});
mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      auth: { signInWithPassword, signUp },
    }),
  },
});

let loginAction: typeof import("@/app/(auth)/actions").loginAction;
let registerAction: typeof import("@/app/(auth)/actions").registerAction;

before(async () => {
  ({ loginAction, registerAction } = await import("@/app/(auth)/actions"));
});

function makeFormData(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }

  return formData;
}

test("loginAction rejects an invalid email before attempting to sign in", async () => {
  signInWithPassword.mock.resetCalls();

  const result = await loginAction(
    { status: "idle" },
    makeFormData({ email: "not-an-email", password: "password" }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱和密码。",
    email: "not-an-email",
  });
  assert.equal(signInWithPassword.mock.callCount(), 0);
});

test("loginAction rejects an email with a one-character top-level domain", async () => {
  const result = await loginAction(
    { status: "idle" },
    makeFormData({ email: "a@b.c", password: "password" }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱和密码。",
    email: "a@b.c",
  });
});

test("loginAction rejects an empty password and returns the normalized email", async () => {
  const result = await loginAction(
    { status: "idle" },
    makeFormData({ email: "  USER@example.com  ", password: "" }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱和密码。",
    email: "user@example.com",
  });
});

test("loginAction signs in with parsed data, refreshes the layout, and redirects", async () => {
  signInWithPassword.mock.resetCalls();
  revalidatePath.mock.resetCalls();
  redirect.mock.resetCalls();

  await assert.rejects(
    loginAction(
      { status: "idle" },
      makeFormData({
        email: "  USER@example.com  ",
        password: "password",
        next: "/chat?from=login",
      }),
    ),
    (error) => error instanceof RedirectError && error.path === "/chat?from=login",
  );

  assert.deepEqual(signInWithPassword.mock.calls[0]?.arguments, [
    { email: "user@example.com", password: "password" },
  ]);
  assert.deepEqual(revalidatePath.mock.calls[0]?.arguments, ["/", "layout"]);
  assert.deepEqual(redirect.mock.calls[0]?.arguments, ["/chat?from=login"]);
});

test("registerAction rejects an email with a one-character top-level domain", async () => {
  const result = await registerAction(
    { status: "idle" },
    makeFormData({
      email: "a@b.c",
      password: "password",
      confirmPassword: "password",
    }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱地址。",
    email: "a@b.c",
  });
});

test("registerAction rejects a password shorter than eight characters", async () => {
  const result = await registerAction(
    { status: "idle" },
    makeFormData({
      email: "user@example.com",
      password: "short",
      confirmPassword: "short",
    }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "密码至少需要 8 位。",
    email: "user@example.com",
  });
});

test("registerAction rejects mismatched passwords", async () => {
  const result = await registerAction(
    { status: "idle" },
    makeFormData({
      email: "user@example.com",
      password: "password",
      confirmPassword: "different",
    }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "两次输入的密码不一致。",
    email: "user@example.com",
  });
});

test("registerAction signs up with parsed data", async () => {
  signUp.mock.resetCalls();

  const result = await registerAction(
    { status: "idle" },
    makeFormData({
      email: "  USER@example.com  ",
      password: "password",
      confirmPassword: "password",
    }),
  );

  assert.deepEqual(signUp.mock.calls[0]?.arguments, [
    { email: "user@example.com", password: "password" },
  ]);
  assert.deepEqual(result, {
    status: "success",
    message: "注册申请已提交，请检查邮箱并完成验证。",
    email: "user@example.com",
  });
});
