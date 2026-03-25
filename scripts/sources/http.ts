export async function httpGet<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { method: "GET", ...init });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const details = body ? `: ${body}` : "";
    throw new Error(`HTTP GET ${url} failed with ${response.status} ${response.statusText}${details}`);
  }

  return (await response.json()) as T;
}

export async function httpPostForm<T = unknown>(
  url: string,
  form: Record<string, string>,
  init?: RequestInit
): Promise<T> {
  const body = new URLSearchParams(form);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(init?.headers ?? {})
    },
    ...init,
    body
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const details = text ? `: ${text}` : "";
    throw new Error(`HTTP POST ${url} failed with ${response.status} ${response.statusText}${details}`);
  }

  return (await response.json()) as T;
}
