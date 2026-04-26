const PROTECTED_APP_PREFIXES = ["/dashboard", "/onboarding", "/plans", "/workout", "/settings"];

export function isProtectedAppRoute(pathname: string): boolean {
  return PROTECTED_APP_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthenticatedShellRoute(pathname: string): boolean {
  return (
    isProtectedAppRoute(pathname) ||
    pathname === "/today" ||
    pathname === "/check-in"
  );
}
