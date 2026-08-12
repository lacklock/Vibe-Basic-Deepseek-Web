import assert from "node:assert/strict";
import test from "node:test";

import { getSafeRedirect } from "@/lib/auth/redirect";

test("允许站内路径并保留查询参数", () => {
  assert.equal(getSafeRedirect("/chat?id=1"), "/chat?id=1");
});

test("拒绝站外和协议相对地址", () => {
  assert.equal(getSafeRedirect("https://evil.example"), "/");
  assert.equal(getSafeRedirect("//evil.example"), "/");
  assert.equal(getSafeRedirect("/\\evil.example"), "/");
});

test("空地址使用指定的回退路径", () => {
  assert.equal(getSafeRedirect(undefined, "/dashboard"), "/dashboard");
});
