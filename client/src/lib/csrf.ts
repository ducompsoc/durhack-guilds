import { fetchMegateamsApi } from "./api";

/**
 * Gets a CSRF token and saves the token hash to a cookie.
 * Both the cookie and the token need to be sent on API requests (excluding GET, HEAD, OPTIONS).
 * The token should be attached to requests in an HTTP header 'x-csrf-token'.
 */
export async function getCsrfToken(): Promise<string> {
  const csrf_token_result = await fetchMegateamsApi("/auth/csrf-token");

  return csrf_token_result.token;
}

/**
 * Gets a CSRF token and saves the token hash to a cookie, then attaches
 * the token to the given request as an HTTP header.
 */
export async function attachCsrfTokenToRequest(request: Request): Promise<void> {
  const csrf_token = await getCsrfToken();
  request.headers.set("x-csrf-token", csrf_token);
}
