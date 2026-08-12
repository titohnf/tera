import Image from 'next/image'
import type { ReactNode } from 'react'

/**
 * Kartu identitas murid — dipakai halaman detail siswa admin dan beranda anak
 * di portal keluarga, supaya keduanya membuka dengan bentuk yang sama.
 *
 * Yang berbeda antara kedua portal cuma aksi di pojok kanan (admin punya
 * "Edit", keluarga tidak punya apa-apa), jadi itu dijadikan slot alih-alih dua
 * salinan kartu yang pelan-pelan berbeda ukuran huruf dan warna badge-nya.
 */

function inisial(nama: string | null): string {
  if (!nama) return '?'
  return nama
    .split(' ')
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? '')
    .join('')
}

export default function SiswaHeaderCard({
  fullName,
  nickname,
  grade,
  isActive,
  avatarUrl,
  aksi,
}: {
  fullName: string | null
  nickname?: string | null
  grade?: string | null
  isActive?: boolean
  avatarUrl?: string | null
  aksi?: ReactNode
}) {
  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName ?? ''}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-base font-semibold text-blue-700">{inisial(fullName)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold text-gray-900">{fullName ?? '(tanpa nama)'}</h1>
            {isActive !== undefined && (
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {isActive ? 'Aktif' : 'Non-aktif'}
              </span>
            )}
          </div>
          {(nickname || grade) && (
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {nickname && <span className="text-sm text-gray-500">{nickname}</span>}
              {grade && (
                <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                  Kelas {grade}
                </span>
              )}
            </div>
          )}
        </div>
        {aksi}
      </div>
    </div>
  )
}
