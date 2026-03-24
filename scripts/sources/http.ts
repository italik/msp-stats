export async function httpGet<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { method: "GET", ...init });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const details = body ? `: ${body}` : "";
    throw new Error(`HTTP GET ${url} failed with ${response.status} ${response.statusText}${details}`);
  }

  return (await response.json()) as T;
}
