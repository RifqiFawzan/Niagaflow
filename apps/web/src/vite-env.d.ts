/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Alamat dasar API di hosting, tanpa garis miring di akhir.
   * Contoh: "https://niagaflow-api.onrender.com"
   *
   * Kosongkan di lokal supaya permintaan lewat proxy dev Vite.
   */
  readonly VITE_API_URL?: string;

  /**
   * Password akun demo untuk tombol isi-otomatis di halaman login.
   * Nilai VITE_ ikut terkunci ke bundel dan terlihat di browser, jadi
   * hanya layak untuk akun demo, bukan akun sungguhan.
   */
  readonly VITE_DEMO_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
