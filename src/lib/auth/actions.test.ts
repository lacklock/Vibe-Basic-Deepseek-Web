import assert from "node:assert/strict";
import test from "node:test";

import { loginAction, registerAction } from "../../app/(auth)/actions";

test("loginAction rejects an invalid email before attempting to sign in", async () => {
  const formData = new FormData();
  formData.set("email", "not-an-email");
  formData.set("password", "password");

  const result = await loginAction({ status: "idle" }, formData);

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱和密码。",
    email: "not-an-email",
  });
});

test("loginAction rejects an email accepted by the former loose regex", async () => {
  const formData = new FormData();
  formData.set("email", "a@b.c");
  formData.set("password", "password");

  const result = await loginAction({ status: "idle" }, formData);

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱和密码。",
    email: "a@b.c",
  });
});

test("loginAction rejects an empty password and returns the normalized email", async () => {
  const formData = new FormData();
  formData.set("email", "  USER@example.com  ");
  formData.set("password", "");

  const result = await loginAction({ status: "idle" }, formData);

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱和密码。",
    email: "user@example.com",
  });
});

test("registerAction rejects an email accepted by the former loose regex", async () => {
  const formData = new FormData();
  formData.set("email", "a@b.c");
  formData.set("password", "password");
  formData.set("confirmPassword", "password");

  const result = await registerAction({ status: "idle" }, formData);

  assert.deepEqual(result, {
    status: "error",
    message: "请输入有效的邮箱地址。",
    email: "a@b.c",
  });
});

test("registerAction rejects a password shorter than eight characters", async () => {
  const formData = new FormData();
  formData.set("email", "user@example.com");
  formData.set("password", "short");
  formData.set("confirmPassword", "short");

  const result = await registerAction({ status: "idle" }, formData);

  assert.deepEqual(result, {
    status: "error",
    message: "密码至少需要 8 位。",
    email: "user@example.com",
  });
});

test("registerAction rejects mismatched passwords", async () => {
  const formData = new FormData();
  formData.set("email", "user@example.com");
  formData.set("password", "password");
  formData.set("confirmPassword", "different");

  const result = await registerAction({ status: "idle" }, formData);

  assert.deepEqual(result, {
    status: "error",
    message: "两次输入的密码不一致。",
    email: "user@example.com",
  });
});
