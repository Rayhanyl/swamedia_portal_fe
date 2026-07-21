# Modul Kategori Surat (Master Data)

## 1. Tujuan dan Fungsi Modul

Halaman admin `/nomor-surat/kategori` untuk mengelola master data **kategori
surat keluar** (kode `DR-01` s.d. `DR-09` bawaan + kategori tambahan admin) —
create, edit, delete, dan lihat jumlah surat per kategori. Bagian dari
modul e-office/administrasi surat.

Kontrak API: `documentation/note/api/03-master-data.md#modul-kategori-surat`
untuk CRUD kategori; jumlah surat dihitung lewat modul Daftar Surat
(`documentation/note/api/07-e-office.md` atau setara) karena endpoint
kategori sendiri **tidak** mengembalikan field jumlah surat.

## 2. Alur Kerja (Flow)

### 2.1 Render awal

1. `KategoriSuratPage` (Server Component) memanggil
   `getKategoriSuratWithCount()`:
   - `getKategoriSuratList()` → `GET /api/v1/master/kategori-surat?limit=100`
     (limit besar karena master ini kecil — 9 default + tambahan admin,
     tidak perlu paginasi UI).
   - Untuk **setiap** kategori, `getJumlahSuratByKategori(kategoriId)` →
     `GET /api/v1/business/daftar-surat?kategori_surat_id={id}&limit=1`,
     lalu baca **`meta.pagination.totalItems`** (bukan `data`, karena
     `limit=1` hanya dipakai supaya request murah — kita cuma butuh
     metadata paginasi, bukan isi datanya).
   - Kedua langkah digabung paralel per-kategori (`Promise.all`), tapi
     langkah 1 harus selesai dulu sebelum langkah 2 bisa dimulai (butuh
     daftar ID kategori).
2. `<KategoriSuratTable initialItems={items} />` menerima hasil gabungan
   (`KategoriSuratWithCount[]`) sebagai state awal.

### 2.2 Tambah kategori

1. Klik **"Tambah Kategori"** → `openAdd()` mengosongkan form
   (`EMPTY_FORM: {id:null, kode:"", nama:"", status:"AKTIF"}`) dan membuka
   dialog.
2. User mengisi Kode (maks 10 karakter, placeholder `DR-10`), Nama Kategori,
   dan Status (toggle button Aktif/Tidak Aktif — bukan dropdown/checkbox).
3. Klik **"Simpan"** → `handleSave()`:
   - Validasi minimal: `kode`/`nama` tidak boleh kosong (trim) — kalau
     kosong, toast error dan berhenti sebelum memanggil API.
   - `isEdit = form.id !== null` menentukan method+URL: `POST
     /api/proxy/master/kategori-surat` (tambah) atau `PUT
     /api/proxy/master/kategori-surat/{id}` (edit).
   - Sukses → gabungkan hasil ke state lokal:
     - Tambah: item baru mendapat `jumlahSurat: 0` (kategori baru pasti
       belum punya surat, tidak perlu panggil ulang endpoint hitung).
     - Edit: `{...it, ...saved}` — **urutan spread ini penting**: response
       `PUT` tidak mengandung `jumlahSurat`, jadi `...saved` (belakangan)
       tidak menimpa `jumlahSurat` lama yang sudah ada di `it` (`...it`
       duluan). Kalau urutan dibalik, jumlah surat akan hilang/ke-nol
       setiap kali kategori diedit.
   - Toast sukses (beda teks tambah vs edit) dan dialog ditutup.

### 2.3 Hapus kategori

1. Klik ikon tempat sampah pada baris → `handleDelete(item)`. Kalau
   `item.isDefault === true`, tombol sudah `disabled` di level UI (kategori
   bawaan `DR-01..09` tidak bisa dihapus) sehingga fungsi ini hanya benar-
   benar jalan untuk kategori tambahan admin.
2. `handleDelete` **tidak langsung memanggil API** — hanya men-set
   `deleteTarget` untuk membuka dialog konfirmasi bergaya sama dengan
   dialog Tambah/Edit (header gelap, pesan `Hapus kategori "{nama}"
   ({kode})? Tindakan ini tidak bisa dibatalkan.`, tombol Batal/Hapus).
   Ini menggantikan `window.confirm()` browser bawaan yang sebelumnya
   dipakai — diganti karena tampilannya tidak konsisten dengan desain
   aplikasi (dan tidak bisa distyle sama sekali).
3. Klik **"Hapus"** di dialog → `confirmDelete()`: `DELETE
   /api/proxy/master/kategori-surat/{id}`, sukses → hapus item dari state
   lokal (`filter`), toast sukses, tutup dialog (`setDeleteTarget(null)`).
   Tombol menampilkan "Menghapus..." selama proses (`deleting` state).

## 3. Struktur Folder dan File

```
src/
├── app/(dashboard)/nomor-surat/kategori/
│   ├── page.tsx                         # Server Component — fetch + compose
│   └── _components/
│       └── kategori-surat-table.tsx     # Client Component — tabel, 2 dialog (form + delete)
└── lib/
    └── kategori-surat.ts                # Types + getKategoriSuratList/getJumlahSuratByKategori/getKategoriSuratWithCount
```

## 4. Komponen dan Tanggung Jawab

| Komponen | Tanggung jawab |
|---|---|
| `KategoriSuratPage` | Server Component tipis: satu pemanggilan `getKategoriSuratWithCount()`, tidak ada logika tampilan. |
| `KategoriSuratTable` | Semua interaktivitas: render tabel, dialog tambah/edit, dialog konfirmasi hapus, state CRUD. |
| `Dialog`/`DialogContent`/`DialogHeader`/`DialogBody`/`DialogFooter`/`DialogTitle` (`components/ui/dialog.tsx`) | Primitif dialog generik (dibangun session ini di atas `@base-ui/react/dialog`) — dipakai modul ini untuk **dua** dialog berbeda (form & konfirmasi hapus) sekaligus jadi referensi pola konfirmasi in-app untuk modul lain. |

## 5. Hook yang Digunakan

Murni `useState`, tidak ada `useEffect`/`useMemo`:

- `items: KategoriSuratWithCount[]` — sumber tabel, diinisialisasi dari
  `initialItems` (props Server Component).
- `dialogOpen: boolean`, `form: FormState` — state dialog tambah/edit.
- `saving: boolean` — loading submit form.
- `deleteTarget: KategoriSuratWithCount | null` — item yang sedang
  dikonfirmasi hapus (`null` = dialog hapus tertutup).
- `deleting: boolean` — loading submit hapus.

Tidak ada fetch-on-mount: data tabel selalu dimulai dari props, dan setiap
mutasi memperbarui state lokal langsung dari response API (bukan re-fetch
seluruh daftar).

## 6. Cara Pengambilan Data dari API

**Server → backend** (render awal, via `fetchBackend`):

| Fungsi | Endpoint |
|---|---|
| `getKategoriSuratList()` | `GET /api/v1/master/kategori-surat?limit=100` |
| `getJumlahSuratByKategori(id)` | `GET /api/v1/business/daftar-surat?kategori_surat_id={id}&limit=1` (baca `meta.pagination.totalItems`) |

**Client → proxy → backend** (semua mutasi):

| Aksi | Method | Endpoint |
|---|---|---|
| Tambah | `POST` | `/api/proxy/master/kategori-surat` |
| Edit | `PUT` | `/api/proxy/master/kategori-surat/{id}` |
| Hapus | `DELETE` | `/api/proxy/master/kategori-surat/{id}` |

Tidak ada refetch daftar penuh setelah mutasi — tabel diperbarui secara
lokal dari `body.data` response (lihat §2.2/§2.3). Ini berarti kalau ada
perubahan dari sumber lain (mis. admin lain menambah kategori bersamaan),
tabel tidak akan tersinkron sampai halaman di-reload.

## 7. State Management

Lokal per-komponen (`useState` di `KategoriSuratTable`) — tidak ada state
global. Wajar untuk halaman admin CRUD sederhana dengan satu tabel dan
tidak ada state yang perlu dibagi ke komponen lain.

## 8. Validasi Form dan Mekanisme Submit

- **Form tambah/edit**: validasi minimal — `kode` dan `nama` wajib diisi
  (non-empty setelah `trim()`); tidak ada validasi format kode di
  client (placeholder menyarankan format `DR-xx` tapi tidak dipaksakan
  lewat regex — validasi format sesungguhnya, jika ada, terjadi di
  backend). `maxLength={10}` pada input Kode adalah pembatas UI, bukan
  validasi bisnis.
- **Status**: dipilih lewat dua `Button` toggle (`AKTIF`/`TIDAK_AKTIF`),
  bukan native checkbox/select — memberi tampilan mirip segmented control,
  konsisten dengan desain referensi (screenshot) yang diberikan.
- **Submit tambah/edit**: `handleSave()` async, `saving` state
  mencegah double-submit, `finally` selalu `setSaving(false)`.
- **Submit hapus**: dua langkah wajib (klik ikon → buka dialog konfirmasi →
  klik "Hapus" di dialog) — tidak ada single-click destructive action.
  `deleting` state mencegah double-submit dengan pola yang sama.

## 9. Routing dan Navigasi

Single-page module di `/nomor-surat/kategori`, bagian dari grup menu
"Nomor Surat" di sidebar (breadcrumb otomatis dari `menu-saya`, lihat
`DashboardBreadcrumb` di modul Authentication/layout). Tidak ada sub-route
atau deep link ke kategori tertentu — semua interaksi terjadi dalam satu
halaman lewat dialog, tidak lewat navigasi ke URL berbeda.

## 10. Middleware, Authentication, Authorization

Dilindungi oleh guard `(dashboard)` standar (lihat modul Authentication
§10). Tidak ada pengecekan role eksplisit di level komponen — kontrol akses
"siapa boleh CRUD master data ini" didelegasikan penuh ke backend (menu ini
kemungkinan hanya muncul di sidebar untuk role yang berwenang, ditentukan
oleh `menu-saya`, bukan dicek ulang di halaman ini).

Satu aturan bisnis yang ditegakkan di **frontend** (bukan RBAC, tapi
proteksi data integritas): kategori dengan `isDefault: true` (`DR-01..09`)
tidak bisa dihapus — tombol hapus di-`disabled` dan `handleDelete()`
langsung `return` kalau `item.isDefault`. ini murni UX guard; penegakan
sesungguhnya tetap ada di backend (endpoint `DELETE` kemungkinan menolak
kategori default terlepas dari apa yang dikirim frontend).

## 11. Library/Package yang Digunakan

| Package | Fungsi |
|---|---|
| `lucide-react` | Ikon (`InfoIcon`, `LockIcon`, `PencilIcon`, `PlusIcon`, `Trash2Icon`). |
| `@base-ui/react/dialog` (via `components/ui/dialog.tsx`) | Primitif modal untuk dialog form dan dialog konfirmasi hapus. |
| `@/lib/utils` (`cn`) | className kondisional (warna badge status). |
| `@/lib/toast-manager` | Notifikasi hasil setiap aksi CRUD. |

Tabel dirender sebagai elemen `<table>` HTML biasa (bukan komponen
`DataTable` generik) — cukup untuk ukuran data kecil (~9-20 baris) tanpa
sorting/searching kompleks.

## 12. Reusable/Shared Component

- **`Dialog` primitives** (`components/ui/dialog.tsx`) — dibuat khusus
  session ini, sekarang dipakai dua kali di modul ini sendiri (form +
  konfirmasi hapus) dan menjadi pola rujukan untuk modul lain yang butuh
  dialog konfirmasi in-app pengganti `window.confirm()`.
- `Badge`, `Button`, `Input` dari `components/ui/` — komponen generik.
- `KategoriSuratWithCount` (tipe) — dipakai bersama antara `lib/kategori-surat.ts`
  (sumber data) dan `kategori-surat-table.tsx` (konsumen), memastikan
  bentuk data konsisten dari server sampai render.

## 13. Catatan Implementasi & Hal yang Perlu Diperhatikan

1. **"Jumlah Surat" bukan field asli dari endpoint kategori** — dihitung
   dengan memanggil endpoint Daftar Surat sekali per kategori
   (`limit=1`, baca `meta.pagination.totalItems`). Ini keputusan sadar
   (dikonfirmasi eksplisit oleh user, opsi "Hitung per kategori via
   daftar-surat") karena tidak ada endpoint agregat yang mengembalikan
   count per kategori langsung. **Konsekuensi performa**: render halaman
   ini melakukan **N+1 request** (1 untuk daftar kategori + N untuk
   masing-masing kategori) — dengan ~9-20 kategori ini masih murah, tapi
   kalau jumlah kategori bertambah signifikan, pertimbangkan minta backend
   menambahkan endpoint agregat (`GROUP BY kategori_surat_id`) alih-alih
   terus menaikkan N di sini.
2. **Endpoint Daftar Surat punya default `tahun` = tahun berjalan** —
   artinya "Jumlah Surat" yang ditampilkan adalah **jumlah surat tahun ini
   saja per kategori**, bukan akumulasi all-time. Ini konsisten dengan
   aturan bisnis penomoran surat (nomor urut di-reset tiap tahun per
   kategori — lihat banner "Format Nomor Surat" di halaman), tapi penting
   diingat kalau ada permintaan menampilkan total all-time di masa depan —
   itu akan butuh parameter tambahan atau endpoint berbeda, bukan sekadar
   baca ulang response yang sama.
3. **Format nomor surat di banner info** (`[Urutan 3 digit]/[Kode
   Kategori]/SWA/[Bulan Romawi]/[Tahun]`, contoh `037/DR-01/SWA/VII/2026`)
   sengaja memakai **format asli sesuai dokumentasi API**, bukan format
   yang ada di mockup/screenshot desain awal — dikonfirmasi eksplisit oleh
   user (opsi "Pakai format asli dari dokumentasi API") karena mockup
   ternyata tidak akurat dibanding kontrak backend sesungguhnya.
4. **Dialog konfirmasi hapus menggantikan `window.confirm()`** — perubahan
   terbaru di modul ini. Kalau membuat fitur delete serupa di modul lain,
   ikuti pola `deleteTarget`/`deleting` + `<Dialog>` kedua ini alih-alih
   `window.confirm()`, demi konsistensi visual di seluruh aplikasi.
5. **Tidak ada refetch setelah mutasi** (lihat §6) — kalau backend menolak
   sebagian mutasi karena alasan yang tidak tercermin di response (state
   tidak konsisten karena race condition multi-admin), UI hanya akan
   ketahuan salah setelah reload manual. Ini trade-off yang diterima untuk
   halaman admin dengan concurrency rendah; pertimbangkan ulang kalau
   modul ini nantinya dipakai banyak admin sekaligus secara bersamaan.
