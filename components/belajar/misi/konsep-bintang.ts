/** Titik bintang lima sudut berpusat di (50,50), untuk eksplorasi lencana. */
export const TITIK_BINTANG_PUBLIK = Array.from({ length: 10 }, (_, k) => {
  const r = k % 2 === 0 ? 40 : 19
  const sudut = (-90 + k * 36) * (Math.PI / 180)
  return `${(50 + r * Math.cos(sudut)).toFixed(2)},${(50 + r * Math.sin(sudut)).toFixed(2)}`
}).join(' ')
