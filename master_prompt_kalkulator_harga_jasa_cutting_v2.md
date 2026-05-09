# Master Prompt Codex — Kalkulator Harga Jasa Cutting

## Tujuan Project

Buat aplikasi web sederhana untuk membantu admin menghitung harga jasa cutting berbagai media/material secara cepat dan konsisten.

Aplikasi ini dipakai untuk menghitung harga berdasarkan:

- Jenis bahan
- Density / kerapatan pola
- Ketebalan bahan
- Ukuran area cutting dalam cm
- Qty / jumlah pcs
- Harga jasa cutting per cm² dari master data

Target utama aplikasi ini adalah **mempercepat admin saat menghitung harga customer**, tanpa perlu membuka Excel atau menghitung manual.

Untuk phase 1, aplikasi **tidak perlu Supabase, tidak perlu login, dan tidak perlu database cloud**. Data disimpan di browser menggunakan `localStorage`.

---

## Tech Stack

Gunakan:

- Next.js
- React
- TypeScript
- Tailwind CSS
- localStorage untuk penyimpanan data
- Vercel-ready deployment

Boleh gunakan shadcn/ui jika sudah tersedia di project, tetapi jangan membuat setup terlalu kompleks. Prioritas utama adalah aplikasi cepat jadi, rapi, mudah dipakai admin, dan minim error.

---

## Prinsip UI/UX

Aplikasi ini akan dipakai admin untuk menghitung harga dengan cepat. Jadi UI harus sangat jelas, tidak membingungkan, dan tidak terlalu ramai.

Gunakan prinsip berikut:

1. Layout bersih, modern, dan professional.
2. Gunakan hierarki visual yang jelas.
3. Input utama harus terlihat seperti flow step-by-step.
4. Admin harus paham urutan input tanpa perlu membaca manual.
5. Hindari tampilan tabel yang terlalu padat.
6. Gunakan label yang jelas dalam bahasa Indonesia.
7. Gunakan format Rupiah otomatis.
8. Gunakan satuan `cm` dan `cm²` secara eksplisit.
9. Tampilkan hasil harga secara besar dan mudah dibaca.
10. Berikan warning/error yang jelas jika data harga belum tersedia.
11. Tombol utama harus jelas:
    - Tambah ke Daftar
    - Copy WhatsApp
    - Reset
12. Untuk master data, buat tampilan yang mudah diedit, dicari, dan difilter.

Tone UI: clean, simple, Apple-like, admin-friendly, tidak terlalu teknikal.

---

## Struktur Halaman

Buat 2 halaman utama:

1. Halaman Kalkulator
2. Halaman Master Data

Navigasi sederhana di bagian atas:

- Kalkulator
- Master Data

Tidak perlu login untuk phase 1.

---

# 1. Halaman Kalkulator

## Tujuan

Admin bisa memilih bahan, density, ketebalan, input ukuran dan qty, lalu mendapatkan harga satuan dan total harga.

## Input

Form kalkulator harus berisi:

1. Pilih Bahan
2. Pilih Density
3. Pilih Ketebalan
4. Panjang dalam cm
5. Lebar dalam cm
6. Qty

Density dipilih manual oleh admin.

Ketebalan harus mengikuti data yang tersedia di master data berdasarkan bahan dan density yang dipilih.

Contoh flow dropdown:

1. Admin pilih bahan: `Besi Esser`
2. Admin pilih density: `High`
3. Sistem hanya menampilkan ketebalan yang tersedia untuk kombinasi bahan + density tersebut
4. Admin input panjang, lebar, qty
5. Sistem menampilkan rate dan hasil harga

---

## Density Options

Gunakan pilihan density berikut:

- Super Low
- Low
- Med
- High
- Super High

---

## Material Awal

Sediakan daftar material awal berikut:

- ACP
- Akrilik
- Alu
- Baja SK 5
- Besi Esser
- Galva
- GRC
- HMR
- Kuningan
- MDF
- PLYWOOD
- PVC
- Stainless
- Tembaga

Material bisa bertambah dari master data.

---

## Rumus Harga

Rumus utama:

```text
Luas per pcs = panjang_cm × lebar_cm

Harga satuan = luas_per_pcs × harga_per_cm2

Total = harga_satuan × qty
```

Contoh:

```text
Bahan: Besi Esser
Ketebalan: 1mm
Density: High
Harga per cm²: Rp 100
Ukuran: 50 × 30 cm
Qty: 3

Luas per pcs = 50 × 30 = 1.500 cm²
Harga satuan = 1.500 × 100 = Rp 150.000
Total = 150.000 × 3 = Rp 450.000
```

Tidak perlu pembulatan harga.

---

## Output Kalkulator

Tampilkan hasil secara real-time:

- Luas per pcs
- Harga per cm²
- Harga satuan
- Total harga

Tampilan hasil harus besar dan jelas.

Contoh UI output:

```text
Luas per pcs
1.500 cm²

Rate
Rp 100 / cm²

Harga Satuan
Rp 150.000

Total
Rp 450.000
```

Harga satuan dan total harus lebih menonjol secara visual.

---

## Validasi Input

Tambahkan validasi:

- Panjang wajib diisi
- Lebar wajib diisi
- Qty wajib diisi
- Panjang, lebar, qty harus lebih besar dari 0
- Jika bahan belum dipilih, tampilkan pesan
- Jika density belum dipilih, tampilkan pesan
- Jika ketebalan belum dipilih, tampilkan pesan
- Jika kombinasi bahan + density + ketebalan tidak ditemukan di master data, tampilkan warning:
  `Harga belum tersedia di master data.`

Jangan sampai aplikasi error/crash ketika data belum lengkap.

---

## Tambah ke Daftar Hitungan

Setelah hasil keluar, admin bisa klik:

```text
Tambah ke Daftar
```

Item masuk ke tabel/list estimasi.

Data item minimal:

- Bahan
- Density
- Ketebalan
- Ukuran
- Luas per pcs
- Qty
- Rate per cm²
- Harga satuan
- Total

Admin bisa:

- Edit item
- Hapus item
- Reset semua item

---

## Daftar Hitungan

Buat section daftar hitungan di bawah kalkulator.

Tampilan harus mudah dibaca.

Jika belum ada item, tampilkan empty state:

```text
Belum ada item cutting.
Tambahkan item dari kalkulator di atas.
```

Jika sudah ada item, tampilkan list/tabel.

Kolom:

- No
- Bahan
- Density
- Tebal
- Ukuran
- Qty
- Harga Satuan
- Total
- Action

Di bawah daftar, tampilkan:

```text
Grand Total: Rp xxx
```

Grand Total harus besar dan jelas.

---

## Copy WhatsApp

Buat tombol:

```text
Copy WhatsApp
```

Ketika diklik, hasil daftar item dicopy ke clipboard dalam format teks WhatsApp.

Format:

```text
Estimasi Jasa Cutting

1. Besi Esser 1mm - Density High
Ukuran: 50 x 30 cm
Qty: 3 pcs
Rate: Rp 100 / cm²
Harga satuan: Rp 150.000
Total: Rp 450.000

2. Akrilik 3mm - Density Med
Ukuran: 40 x 20 cm
Qty: 2 pcs
Rate: Rp 75 / cm²
Harga satuan: Rp 60.000
Total: Rp 120.000

Grand Total: Rp 570.000
```

Setelah berhasil copy, tampilkan feedback:

```text
Berhasil dicopy ke WhatsApp.
```

Jika clipboard gagal, tampilkan error sederhana.

---

# 2. Halaman Master Data

## Tujuan

Owner/admin bisa mengatur daftar harga jasa cutting per cm².

Untuk phase 1, tidak perlu login. Jadi siapa pun yang membuka halaman ini bisa edit data.

Tetapi desain UI harus tetap memberi konteks bahwa halaman ini adalah area pengaturan harga.

---

## Struktur Data Master

Setiap row master data memiliki:

```ts
type CuttingPrice = {
  id: string
  material: string
  density: 'Super Low' | 'Low' | 'Med' | 'High' | 'Super High'
  thickness: string
  pricePerCm2: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

Contoh data:

```json
[
  {
    "id": "1",
    "material": "Besi Esser",
    "density": "High",
    "thickness": "1mm",
    "pricePerCm2": 100,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

## Fitur Master Data

Wajib ada:

1. Tambah data harga baru
2. Edit data harga
3. Hapus data harga
4. Aktif/nonaktif data
5. Search berdasarkan nama bahan
6. Filter berdasarkan density
7. Filter berdasarkan status aktif/nonaktif
8. Sort sederhana, minimal berdasarkan nama bahan
9. Export master data ke file JSON
10. Import master data dari file JSON

Tidak perlu import Excel di phase 1.

---

## Form Master Data

Form tambah/edit berisi:

- Bahan
- Density
- Ketebalan
- Harga per cm²
- Status aktif

Gunakan input text untuk bahan dan ketebalan agar fleksibel.

Gunakan dropdown untuk density.

Gunakan input number untuk harga per cm².

Validasi:

- Bahan wajib diisi
- Density wajib dipilih
- Ketebalan wajib diisi
- Harga per cm² wajib diisi
- Harga per cm² harus lebih dari 0

Jika user membuat kombinasi duplikat material + density + thickness, tampilkan warning:

```text
Kombinasi bahan, density, dan ketebalan ini sudah ada.
```

---

## Penyimpanan Data

Gunakan `localStorage`.

Key localStorage:

```text
cutting_price_master
cutting_estimation_items
```

Data master harga disimpan di:

```text
cutting_price_master
```

Data daftar hitungan sementara disimpan di:

```text
cutting_estimation_items
```

Tujuan menyimpan daftar hitungan sementara adalah agar kalau browser refresh, daftar tidak langsung hilang.

---

## Export / Import JSON

Karena phase 1 tidak pakai Supabase, fitur backup wajib ada.

### Export

Tombol:

```text
Export Master Data
```

Ketika diklik, download file:

```text
cutting-price-master.json
```

Isi file adalah semua master data.

### Import

Tombol:

```text
Import Master Data
```

User bisa upload file JSON dengan format yang sama.

Saat import, validasi struktur data.

Jika valid, replace master data di localStorage.

Sebelum replace, tampilkan confirmation:

```text
Import akan mengganti master data saat ini. Lanjutkan?
```

Jika berhasil:

```text
Master data berhasil diimport.
```

Jika gagal:

```text
Format file tidak valid.
```

---

# UI/UX Detail

## Layout Halaman Kalkulator

Gunakan layout desktop yang nyaman:

- Kiri: Form input kalkulator
- Kanan: Preview hasil harga real-time
- Bawah: Daftar item dan grand total

Untuk mobile:

- Form di atas
- Preview hasil di bawah form
- Daftar item di bawah

Gunakan card layout:

1. Card "Input Cutting"
2. Card "Preview Harga"
3. Card "Daftar Estimasi"

---

## Layout Halaman Master Data

Gunakan card layout:

1. Card "Tambah / Edit Harga"
2. Card "Filter & Search"
3. Card "Tabel Master Data"
4. Card "Backup Data"

Untuk tabel, pastikan tidak terlalu sempit. Jika layar kecil, gunakan horizontal scroll.

---

## Empty State

Tambahkan empty state yang jelas.

Contoh:

```text
Belum ada master data.
Tambahkan harga cutting pertama untuk mulai menggunakan kalkulator.
```

Dan:

```text
Belum ada item estimasi.
Isi form kalkulator, lalu klik Tambah ke Daftar.
```

---

## Error dan Feedback

Gunakan feedback sederhana:

- Berhasil tambah data
- Berhasil update data
- Berhasil hapus data
- Berhasil copy WhatsApp
- Master data belum tersedia
- Harga belum tersedia untuk kombinasi ini

Boleh gunakan toast notification jika tersedia. Jika tidak, gunakan alert/card message sederhana.

---

## Format Angka

Gunakan helper:

```ts
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}
```

Untuk angka luas:

```ts
function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}
```

Input angka tidak perlu format ribuan saat diketik untuk phase 1, tetapi output wajib rapi.

---

## Data Awal

Sediakan seed data minimal agar aplikasi tidak kosong saat pertama dibuka.

Contoh:

```ts
const DEFAULT_PRICE_MASTER = [
  {
    id: 'seed-1',
    material: 'Besi Esser',
    density: 'High',
    thickness: '1mm',
    pricePerCm2: 100,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'seed-2',
    material: 'Akrilik',
    density: 'Med',
    thickness: '3mm',
    pricePerCm2: 75,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'seed-3',
    material: 'PVC',
    density: 'Low',
    thickness: '5mm',
    pricePerCm2: 40,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]
```

User nanti akan mengganti data asli melalui halaman Master Data.

---



---

# Penyesuaian Berdasarkan File Excel Asli

Saya sudah punya file Excel pricelist lama. Data yang dipakai untuk aplikasi phase 1 ada di sheet:

```text
Daftar Barang Cutting
```

Struktur kolom di sheet tersebut adalah:

| Kolom | Nama di Excel | Mapping di App |
|---|---|---|
| A | Bahan | material |
| B | Kode Bahan | materialCode |
| C | Density | density |
| D | Kode Tipe | densityCode |
| E | Ukuran | thickness |
| F | Kode Barang | itemCode |
| G | Harga | pricePerCm2 |

Catatan penting:

- Kolom `Ukuran` di Excel sebenarnya mewakili **ketebalan bahan**, jadi di app gunakan label **Ketebalan**.
- Kolom `Harga` adalah harga jasa cutting per cm².
- Beberapa kombinasi memiliki harga kosong. Kombinasi harga kosong jangan dipakai di kalkulator aktif.
- Untuk seed data awal, gunakan hanya row dengan harga valid lebih dari 0.
- Row dengan harga kosong boleh diabaikan dulu di phase 1, atau disimpan sebagai inactive jika implementasinya mudah.
- Aplikasi tidak perlu membaca file Excel langsung. Untuk phase 1, data seed bisa dimasukkan dari file JSON hasil convert dari sheet tersebut.

Saya juga akan memberikan file seed JSON bernama:

```text
cutting_price_master_seed.json
```

Gunakan file ini sebagai default master data pertama kali aplikasi dibuka.

Jika `localStorage` key `cutting_price_master` belum ada, isi otomatis dari seed data tersebut.
Jika `localStorage` sudah ada, jangan overwrite data user.

## Update Struktur Data Master

Gunakan struktur data master berikut agar sesuai dengan Excel asli:

```ts
type CuttingPrice = {
  id: string
  material: string
  materialCode?: string
  density: 'Super Low' | 'Low' | 'Med' | 'High' | 'Super High'
  densityCode?: 'SL' | 'LO' | 'ME' | 'HI' | 'SH' | string
  thickness: string
  itemCode?: string
  pricePerCm2: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

Untuk kalkulator, field pentingnya tetap:

```text
material + density + thickness + pricePerCm2
```

Field `materialCode`, `densityCode`, dan `itemCode` hanya untuk referensi internal/master data. Jangan membuat UI kalkulator menjadi rumit karena field kode ini.

## Perilaku Dropdown Berdasarkan Data Asli

Dropdown harus mengambil data dari master data aktif saja.

Urutan dropdown:

1. Pilih Bahan
2. Pilih Density
3. Pilih Ketebalan

Aturan:

- Dropdown Bahan menampilkan unique `material` dari master data aktif.
- Dropdown Density menampilkan density yang tersedia untuk bahan terpilih.
- Dropdown Ketebalan menampilkan thickness yang tersedia untuk kombinasi bahan + density.
- Jika kombinasi tidak ada atau inactive, tampilkan pesan: `Harga belum tersedia di master data.`

## Master Data UI Tambahan

Pada halaman Master Data, tampilkan kolom berikut:

- Bahan
- Kode Bahan
- Density
- Kode Density
- Ketebalan
- Kode Barang
- Harga / cm²
- Status
- Action

Namun untuk form tambah/edit, tetap prioritaskan field utama:

- Bahan
- Density
- Ketebalan
- Harga per cm²
- Status aktif

Field kode boleh auto-generated sederhana dari input, atau dikosongkan jika user tidak mengisi.

## Data Summary dari Excel Asli

Dari sheet `Daftar Barang Cutting`, data yang terbaca:

```text
Total row pricelist: 570
Row harga aktif / valid: 476
Row harga kosong / inactive: 94
```

Material yang ada:

```text
ACP
Akrilik
Alu
Baja SK 5
Besi Esser
Galva
GRC
HMR
Kuningan
MDF
PLYWOOD
PVC
Stainless
Tembaga
```

Density yang ada:

```text
Super Low
Low
Med
High
Super High
```

## Cara Pakai Seed Data

Buat file misalnya:

```text
src/data/cutting-price-master-seed.json
```

Isi dari file tersebut adalah data dari `cutting_price_master_seed.json`.

Saat aplikasi load pertama kali:

```ts
const STORAGE_KEY = 'cutting_price_master'

if (!localStorage.getItem(STORAGE_KEY)) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRICE_MASTER))
}
```

Jangan overwrite localStorage jika data sudah ada, karena user mungkin sudah mengedit master data.

---

# Acceptance Criteria

Project dianggap selesai jika:

1. App bisa berjalan tanpa error.
2. Admin bisa tambah/edit/hapus master data.
3. Master data tersimpan di localStorage.
4. Admin bisa pilih bahan, density, dan ketebalan dari master data.
5. Ketebalan mengikuti bahan + density yang tersedia.
6. Admin bisa input panjang, lebar, qty.
7. App menghitung luas, harga satuan, dan total dengan benar.
8. Admin bisa tambah beberapa item ke daftar estimasi.
9. App menampilkan grand total.
10. Admin bisa copy hasil estimasi ke WhatsApp.
11. Format Rupiah tampil rapi.
12. Ada fitur export dan import master data JSON.
13. UI rapi, mudah dipahami, dan tidak membingungkan untuk admin.
14. Tidak perlu Supabase.
15. Tidak perlu login.
16. Tidak perlu import Excel.
17. Tidak perlu PDF quotation.

---

# Important Notes

Jangan membuat aplikasi terlalu kompleks.

Prioritas phase 1:

```text
Admin cepat input → harga keluar → bisa copy WhatsApp.
```

Jangan menambahkan fitur di luar scope seperti:

- Login
- Supabase
- Role user
- PDF quotation
- Import Excel
- Customer database
- History quotation cloud
- Payment
- Invoice

Buat code yang clean, mudah dikembangkan, dan siap dimigrasi ke Supabase di phase berikutnya.

---

# Future Phase Ideas

Jangan implement sekarang, hanya siapkan code agar mudah dikembangkan nanti.

Phase 2 kemungkinan:

- Supabase database
- Login owner/admin
- Role permission
- Simpan quotation
- Customer database
- Export PDF
- Import Excel
- Audit log perubahan harga
- Multi-device sync
