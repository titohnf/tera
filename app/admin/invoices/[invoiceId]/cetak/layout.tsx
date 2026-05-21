export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          aside { display: none !important; }
          main { overflow: visible !important; }
        }
        @media screen {
          aside { display: none !important; }
        }
      `}</style>
      {children}
    </>
  )
}
