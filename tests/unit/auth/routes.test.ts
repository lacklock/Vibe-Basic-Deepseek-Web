import assert from "node:assert/strict";
import test from "node:test";

import { isAuthPage, isPublicRoute } from "@/lib/auth/routes";

test("只公开认证入口和已知静态文件", () => {
  assert.equal(isPublicRoute("/login"), true);
  assert.equal(isPublicRoute("/auth/confirm"), true);
  assert.equal(isPublicRoute("/next.svg"), true);
  assert.equal(isPublicRoute("/reports/a.png"), false);
  assert.equal(isPublicRoute("/robots.txt"), false);
});

test("登录和注册是认证页面", () => {
  assert.equal(isAuthPage("/login"), true);
  assert.equal(isAuthPage("/register"), true);
  assert.equal(isAuthPage("/auth/confirm"), false);
});
