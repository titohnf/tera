/**
 * Alamat aplikasi Sora tempat try out dikerjakan (layar ujian ala TKA dan masuk
 * dengan kode atau akun). Sementara masih alamat terpisah; begitu Sora dipasang
 * di bawah alamat Tera, cukup ubah di sini.
 */
export const SORA_TRYOUT_URL = (process.env.NEXT_PUBLIC_SORA_TRYOUT_URL ?? 'https://sora-bimbeltera.vercel.app').replace(/\/$/, '')
