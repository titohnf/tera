import { redirect } from 'next/navigation'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams

  if (role === 'tutor') redirect('/admin/tutor')
  if (role === 'admin') redirect('/admin/admin')
  if (role === 'student') redirect('/admin/siswa')

  redirect('/admin/tutor')
}
