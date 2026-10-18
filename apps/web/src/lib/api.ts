export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

/** Fetch wrapper: base /api/v1, selalu kirim cookie, error -> ApiRequestError. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let json: ApiSuccess<T> | ApiFailure;
  try {
    json = await res.json();
  } catch {
    throw new ApiRequestError(res.status, "BAD_RESPONSE", "Respons server tidak valid.");
  }

  if (!res.ok || !json.success) {
    const err = (json as ApiFailure).error;
    throw new ApiRequestError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? "Terjadi kesalahan."
    );
  }
  return (json as ApiSuccess<T>).data;
}
