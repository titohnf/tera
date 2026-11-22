import json,re,sys
d={x['urutan']:x for x in json.load(open('soal-mentah.json'))}
terlihat={}
def bersih(t):
    out=[]
    for l in t.split('\n'):
        if re.match(r'^\s*-?\s*(https?://|www\.)',l): continue
        if re.match(r'^Sumber[^:]*:?\s*$',l.strip(),re.I): continue
        out.append(l)
    return re.sub(r'\n{3,}','\n\n','\n'.join(out))
def tampil(u,cetak=True):
    h=d[u];k=h['kartu'][0];paras=[]
    for p in bersih(k['stem']).split('\n\n'):
        key=p.strip()[:80]
        if len(p)>150:
            if key in terlihat and terlihat[key]!=u: paras.append(f'⟦paragraf sama dgn URUTAN {terlihat[key]}⟧'); continue
            terlihat[key]=u
        paras.append(p)
    if k['opsi']: akhir='PILIHAN:\n'+'\n'.join(f"  [{i}] {o['teks'].replace(chr(10),' ')}{' {IMG}' if o['imgs'] else ''}" for i,o in enumerate(k['opsi']))
    else: akhir='GRID:\n'+(k['tabel'] or '')
    if cetak: print(f"=== URUTAN {u} | INDIKATOR {h['nomor']} | {k['bentuk']} | img {len(k['imgs'])}\n"+'\n\n'.join(paras)+'\n'+akhir+'\n')
import io,contextlib
with contextlib.redirect_stdout(io.StringIO()):
    for u in range(1,31): tampil(u)
for u in [int(a) for a in sys.argv[1:]]: tampil(u)
