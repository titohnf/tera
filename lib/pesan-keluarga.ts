/**
 * Pesan WhatsApp untuk memberi orang tua akses ke portal keluarga.
 *
 * Isinya alamat, email login, dan password sementara — password default yang
 * dipasang admin (`PASSWORD_DEFAULT_RESET`) — beserta cara menggantinya.
 */

/** Nomor lokal (08…) atau sudah berawalan 62/+62 menjadi digit internasional untuk wa.me. */
export function nomorWhatsApp(mentah: string | null | undefined): string | null {
  const digit = (mentah ?? '').replace(/\D/g, '')
  if (digit.length < 8) return null
  if (digit.startsWith('62')) return digit
  if (digit.startsWith('0')) return `62${digit.slice(1)}`
  if (digit.startsWith('8')) return `62${digit}`
  return digit
}

export function pesanAksesPortal({
  namaAnak,
  namaOrtu,
  email,
  password,
}: {
  namaAnak: string
  namaOrtu: string | null
  email: string
  password: string
}): string {
  const sapaan = namaOrtu ? `Bapak/Ibu ${namaOrtu}` : 'Bapak/Ibu'
  return [
    `Halo ${sapaan}, kami dari Bimbel Tera.`,
    '',
    `Kini perkembangan belajar ${namaAnak} bisa dipantau langsung lewat sistem kami di:`,
    'https://app.bimbeltera.com',
    '',
    'Cara masuk:',
    `Email: ${email}`,
    `Password sementara: ${password}`,
    '',
    'Agar akun aman, mohon segera ganti password setelah masuk:',
    '1. Buka menu Profil (ikon orang di bagian bawah)',
    '2. Pilih "Ganti password"',
    '3. Isi password lama (password sementara di atas), lalu password baru dan ulangi password baru',
    '4. Tekan "Simpan password"',
    '',
    'Jika ada kendala, silakan balas pesan ini. Terima kasih 🙏',
  ].join('\n')
}

export function tautanWhatsApp(nomor: string, pesan: string): string {
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`
}
