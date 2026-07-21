export default function KuitansiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media screen {
          aside { display: none !important; }
          header { display: none !important; }
          html, body { background: white !important; }
          body > div { background: white !important; }
          main { overflow: visible !important; padding: 0 !important; background: white !important; }
          main > div { max-width: none !important; padding: 0 !important; background: white !important; }
        }
        @media print {
          aside { display: none !important; }
          header { display: none !important; }
          main { overflow: visible !important; }
        }
      `}</style>
      {children}
    </>
  )
}
