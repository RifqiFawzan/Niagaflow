/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Alamat dasar API di hosting, tanpa garis miring di akhir.
   * Contoh: "https://niagaflow-api.onrender.com"
   *
   * Kosongkan di lokal supaya permintaan lewat proxy dev Vite.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
