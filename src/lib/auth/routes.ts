const PUBLIC_ROUTES = new Set(["/login", "/register", "/auth/confirm"]);
const AUTH_PAGES = new Set(["/login", "/register"]);
const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
]);

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname) || PUBLIC_FILES.has(pathname);
}

export function isAuthPage(pathname: string) {
  return AUTH_PAGES.has(pathname);
}
