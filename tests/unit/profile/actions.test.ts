import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

const revalidatePath = mock.fn();
class RedirectError extends Error {
  constructor(readonly path: string) {
    super(`Redirected to ${path}`);
  }
}
const redirect = mock.fn((path: string): never => {
  throw new RedirectError(path);
});
type ClaimsResult =
  { data: { claims: { sub: string } }; error: null } | { data: null; error: Error };

const getClaims = mock.fn(async (): Promise<ClaimsResult> => ({
  data: { claims: { sub: "user-123" } },
  error: null,
}));
const returning = mock.fn(async (selection: Record<string, unknown>) => {
  void selection;
  return [{ id: "user-123" }];
});
const where = mock.fn((condition: unknown) => {
  void condition;
  return { returning };
});
const set = mock.fn((profile: Record<string, unknown>) => {
  void profile;
  return { where };
});
const update = mock.fn((table: unknown) => {
  void table;
  return { set };
});

mock.module("next/cache", {
  namedExports: { revalidatePath },
});
mock.module("next/navigation", {
  namedExports: { redirect },
});
mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({
      auth: { getClaims },
    }),
  },
});
mock.module("@/db", {
  namedExports: {
    db: { update },
  },
});

let updateNicknameAction: typeof import("@/app/profile/actions").updateNicknameAction;

before(async () => {
  ({ updateNicknameAction } = await import("@/app/profile/actions"));
});

beforeEach(() => {
  revalidatePath.mock.resetCalls();
  redirect.mock.resetCalls();
  getClaims.mock.resetCalls();
  update.mock.resetCalls();
  set.mock.resetCalls();
  where.mock.resetCalls();
  returning.mock.resetCalls();
});

function makeFormData(nickname: string) {
  const formData = new FormData();
  formData.set("nickname", nickname);
  return formData;
}

test("updateNicknameAction rejects an empty nickname", async () => {
  const result = await updateNicknameAction({ status: "idle" }, makeFormData("   "));

  assert.deepEqual(result, {
    status: "error",
    message: "请输入昵称。",
    nickname: "",
  });
  assert.equal(update.mock.callCount(), 0);
});

test("updateNicknameAction rejects a nickname longer than 32 characters", async () => {
  const nickname = "a".repeat(33);
  const result = await updateNicknameAction({ status: "idle" }, makeFormData(nickname));

  assert.deepEqual(result, {
    status: "error",
    message: "昵称最多 32 个字符。",
    nickname,
  });
  assert.equal(update.mock.callCount(), 0);
});

test("updateNicknameAction saves the normalized nickname", async () => {
  const result = await updateNicknameAction({ status: "idle" }, makeFormData("  小明  "));

  assert.equal(set.mock.calls[0]?.arguments[0].nickname, "小明");
  assert.equal(where.mock.callCount(), 1);
  assert.equal(returning.mock.callCount(), 1);
  assert.deepEqual(
    revalidatePath.mock.calls.map((call) => call.arguments),
    [["/"], ["/profile"]],
  );
  assert.deepEqual(result, {
    status: "success",
    message: "昵称已保存。",
    nickname: "小明",
  });
});

test("updateNicknameAction redirects an expired session to login without writing", async () => {
  getClaims.mock.mockImplementationOnce(async () => ({
    data: null,
    error: new Error("expired"),
  }));

  await assert.rejects(
    updateNicknameAction({ status: "idle" }, makeFormData("小明")),
    (error) => error instanceof RedirectError && error.path === "/login",
  );

  assert.equal(update.mock.callCount(), 0);
});

test("updateNicknameAction reports a missing profile", async () => {
  returning.mock.mockImplementationOnce(async () => []);

  const result = await updateNicknameAction({ status: "idle" }, makeFormData("小明"));

  assert.deepEqual(result, {
    status: "error",
    message: "用户资料不存在，请稍后重试。",
    nickname: "小明",
  });
  assert.equal(revalidatePath.mock.callCount(), 0);
});
