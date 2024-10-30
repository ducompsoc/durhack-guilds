import { attachCsrfTokenToRequest } from "./csrf";

const isClient = typeof window !== "undefined";

// should be replaced with an (environment?) variable if we separate the API and frontend processes
export const guilds_api_base_url = isClient ? window.location.origin : "";

export async function makeGuildsApiRequest(endpoint: string, options?: RequestInit) {
  const api_endpoint_url = new URL("/api" + endpoint, guilds_api_base_url);
  const request = new Request(api_endpoint_url, options);
  if (options?.method && options.method.toUpperCase() !== "GET") {
    await attachCsrfTokenToRequest(request);
  }
  return request;
}

export async function fetchGuildsApi(
  endpoint: string,
  options?: RequestInit
) {
  const request = await makeGuildsApiRequest(endpoint, options);
  const result = await fetch(request);
  if (!result.ok) throw new Error("Error making Guilds API request!");

  return await result.json();
}
