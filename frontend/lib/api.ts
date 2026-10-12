export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls the backend through the Next proxy; the auth cookie travels with it. */
export async function api<T = void>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function readMessage(response: Response): Promise<string> {
  try {
    const { message } = (await response.json()) as {
      message?: string | string[];
    };
    if (Array.isArray(message)) return message.join('. ');
    if (message) return message;
  } catch {
    // fall through to the generic message
  }
  return `Request failed (${response.status})`;
}
