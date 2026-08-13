import assert from "node:assert/strict";
import test, { before, beforeEach, mock } from "node:test";

let claimsResult: {
  data: { claims?: { sub?: string; email?: string } } | null;
  error: Error | null;
} = {
  data: null,
  error: new Error("expired"),
};

const getClaims = mock.fn(async () => claimsResult);

mock.module("next/navigation", {
  namedExports: {
    redirect: (path: string): never => {
      throw new Error(`redirect:${path}`);
    },
  },
});

mock.module("@/lib/supabase/server", {
  namedExports: {
    createClient: async () => ({ auth: { getClaims } }),
  },
});

let withAuthenticatedRoute: typeof import("@/lib/auth/require-user").withAuthenticatedRoute;

before(async () => {
  ({ withAuthenticatedRoute } = await import("@/lib/auth/require-user"));
});

beforeEach(() => {
  claimsResult = {
    data: null,
    error: new Error("expired"),
  };
  getClaims.mock.resetCalls();
});

test("withAuthenticatedRoute returns 401 without invoking the route handler for an expired session", async () => {
  const handler = mock.fn(async () => Response.json({ ok: true }));
  const authenticatedHandler = withAuthenticatedRoute(handler);

  const response = await authenticatedHandler(new Request("http://localhost/api/example"));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "未登录或登录状态已失效。" });
  assert.equal(handler.mock.callCount(), 0);
});

test("withAuthenticatedRoute rejects claims without a subject", async () => {
  claimsResult = { data: { claims: { email: "user@example.com" } }, error: null };
  const handler = mock.fn(async () => Response.json({ ok: true }));

  const response = await withAuthenticatedRoute(handler)(
    new Request("http://localhost/api/example"),
  );

  assert.equal(response.status, 401);
  assert.equal(handler.mock.callCount(), 0);
});

test("withAuthenticatedRoute passes authenticated claims and route context to the handler", async () => {
  claimsResult = {
    data: { claims: { sub: "user-123", email: "user@example.com" } },
    error: null,
  };
  const handler = mock.fn(
    async (request: Request, claims: { sub: string }, routeContext: { params: { id: string } }) =>
      Response.json({
        pathname: new URL(request.url).pathname,
        userId: claims.sub,
        routeId: routeContext.params.id,
      }),
  );
  const context = { params: { id: "chat-123" } };

  const response = await withAuthenticatedRoute(handler)(
    new Request("http://localhost/api/example"),
    context,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    pathname: "/api/example",
    userId: "user-123",
    routeId: "chat-123",
  });
  assert.deepEqual(handler.mock.calls[0]?.arguments.slice(1), [
    { sub: "user-123", email: "user@example.com" },
    context,
  ]);
});
