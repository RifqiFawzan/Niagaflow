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

/** Ubah error apa pun jadi pesan yang layak ditampilkan ke pengguna. */
export function errorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  return err instanceof ApiRequestError ? err.message : fallback;
}

/** Cek kode error API (mis. SKU_DUPLICATE) tanpa kehilangan type-safety. */
export function isApiErrorCode(err: unknown, code: string): boolean {
  return err instanceof ApiRequestError && err.code === code;
}

/**
 * Alamat dasar API.
 *
 * Di lokal kosong, sehingga permintaan memakai path relatif `/api/v1` dan
 * diteruskan proxy dev Vite ke http://localhost:4000.
 *
 * Di hosting, isi VITE_API_URL dengan URL backend (tanpa garis miring di akhir),
 * mis. "https://niagaflow-api.onrender.com".
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** Fetch wrapper: base /api/v1, selalu kirim cookie, error -> ApiRequestError. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
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
