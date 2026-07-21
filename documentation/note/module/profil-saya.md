# Modul Profil Saya (Akun Saya)

## 1. Tujuan dan Fungsi Modul

Halaman `/profil` menampilkan dan mengizinkan edit data akun pengguna yang
sedang login. Data akun sesungguhnya dikelola di **WSO2 Identity Server**;
halaman ini adalah UI tipis di atas endpoint self-service
`GET/PUT /api/v1/akun-saya` (lihat
`documentation/note/api/02-dashboard-dan-self-service.md#modul-akun-saya`).

Field yang ditampilkan dan sumbernya (keputusan desain, bukan default
framework):

| Field | Sumber | Bisa diedit? |
|---|---|---|
| Avatar/Nama/Role/Email (kartu ringkasan) | klaim gabungan (`getServerUser`) | Tidak |
| Username | klaim `id_token` (`user.username`) | Tidak — username identitas WSO2 IS, bukan bagian `akun-saya` |
| First Name / Last Name | `GET /api/v1/akun-saya` | Ya |
| Email | `GET /api/v1/akun-saya` | Ya |
| Telephone | `GET /api/v1/akun-saya` | Ya (validasi: hanya angka) |
| Organization | `GET /api/v1/akun-saya` | Tidak |
| Role Name | klaim `swaportal_role_name` | Tidak — role eksklusif diatur admin |

Field "Status" yang ada di desain awal **sengaja dihilangkan** — tidak ada
sumber data untuk itu di API (`akun-saya` maupun klaim), jadi tidak
ditampilkan alih-alih diisi data palsu.

## 2. Alur Kerja (Flow)

1. User membuka `/profil`. `ProfilSayaPage` (Server Component) memanggil
   `getAkunSaya()` dan `getServerUser()` secara paralel (`Promise.all`).
2. `getUserDisplay(user)` menurunkan data tampilan kartu ringkasan (avatar,
   nama, role badge, email) — fungsi bersama yang sama dipakai header &
   sidebar (lihat modul Authentication §12).
3. `username` diambil dari `user.username` (klaim `id_token`), `roleName`
   dari `user.swaportal_role_name`; keduanya fallback ke `"-"` kalau tidak
   ada.
4. Halaman merender grid 3-kolom (`lg:grid-cols-3`): kartu ringkasan avatar
   di kiri (1 kolom), form akun di kanan (`lg:col-span-2`). Di bawah
   breakpoint `lg` (termasuk ukuran tablet), grid jatuh ke 1 kolom —
   kartu ringkasan di atas, form di bawah — sesuai permintaan eksplisit
   agar tablet berperilaku seperti HP, bukan layout desktop yang dipaksakan
   menyempit.
5. `AkunSayaForm` (Client Component) menerima `akun`, `username`, `roleName`
   sebagai props awal dan membuat state form terkontrol untuk field yang
   bisa diedit (`firstName`, `lastName`, `email`, `telepon`).
6. User mengubah field → `updateField()` memperbarui state. Untuk telepon,
   `handleTeleponChange()` menyaring huruf saat mengetik (`sanitizeTelepon`)
   **dan** menandai error inline (`containsLetter`) secara real-time,
   supaya karakter huruf tidak pernah benar-benar masuk ke state.
7. User klik **"Simpan Preferensi"** → `handleSave()`:
   - Validasi ulang telepon (guard terakhir sebelum submit, karena state
     sudah disaring per-keystroke tapi tetap dicek lagi untuk konsistensi).
   - `PUT /api/proxy/akun-saya` dengan body `{firstName, lastName, email,
     telepon}` — **hanya** field yang boleh diedit, field read-only tidak
     dikirim.
   - Sukses → toast sukses ("Data akun berhasil diperbarui"). Gagal → toast
     error dengan `body.message` dari backend atau fallback generik.

## 3. Struktur Folder dan File

```
src/
├── app/(dashboard)/profil/
│   ├── page.tsx                       # Server Component — fetch data, layout grid
│   └── _components/
│       └── akun-saya-form.tsx         # Client Component — form terkontrol + submit
└── lib/
    └── akun-saya.ts                   # AkunSaya type + getAkunSaya() (server helper)
```

Bergantung juga pada modul Authentication: `getServerUser()`,
`getUserDisplay()` (lihat `documentation/note/module/authentication.md`).

## 4. Komponen dan Tanggung Jawab

| Komponen | Tanggung jawab |
|---|---|
| `ProfilSayaPage` | Server Component: fetch `getAkunSaya()` + `getServerUser()` paralel, susun layout responsif, teruskan data sebagai props ke form client. |
| `AkunSayaForm` | Client Component: state form terkontrol, validasi telepon, submit `PUT` ke proxy, toast hasil. |
| `ProfileField` (internal `akun-saya-form.tsx`) | Baris label+input reusable di dalam modul ini: layout responsif (`grid-cols-1` di mobile, `[140px_1fr]` di `sm:`), mode read-only (ikon gembok + `disabled`), pesan error inline opsional. |

## 5. Hook yang Digunakan

- `useState` — satu-satunya hook di modul ini:
  - `form: EditableFields` (state terkontrol 4 field yang bisa diedit).
  - `teleponError: string | undefined`.
  - `saving: boolean` (disable tombol + label "Menyimpan..." saat submit).
- Tidak ada `useEffect`: data awal datang dari props (`akun`, `username`,
  `roleName`) yang diisi oleh Server Component saat render pertama, jadi
  tidak perlu fetch-on-mount di client.

## 6. Cara Pengambilan Data dari API

- **Server → backend** (baca awal): `getAkunSaya()`
  ([akun-saya.ts](../../../src/lib/akun-saya.ts)) memanggil `fetchBackend("/api/v1/akun-saya")`
  — server-to-server, mengikuti pola `fetchBackend` (lihat modul
  Authentication §6). Best-effort: kegagalan mengembalikan `null`, halaman
  tetap render dengan field kosong bukan error page.
- **Client → proxy → backend** (submit edit): `AkunSayaForm.handleSave()`
  memanggil `PUT /api/proxy/akun-saya` (generic proxy, bukan endpoint
  khusus) — otomatis mendapat `Authorization` header + retry-on-401 dari
  `/api/proxy/[...path]/route.ts`.

## 7. State Management

Lokal per-komponen (`useState` di `AkunSayaForm`) — tidak ada state global
yang dilibatkan selain `user` dari `AuthContext` (dipakai secara tidak
langsung lewat `getUserDisplay` di Server Component, bukan dibaca ulang di
client form). Dipilih karena form ini berdiri sendiri, hasil submit tidak
memengaruhi state di luar halaman `/profil` (header/sidebar menampilkan
nama dari `user` context yang tidak diperbarui otomatis setelah submit —
lihat catatan di §13).

## 8. Validasi Form dan Mekanisme Submit

- **Telepon** — satu-satunya validasi non-trivial: tidak boleh mengandung
  huruf. Dua lapis:
  1. `sanitizeTelepon()` — menyaring huruf dari input **saat mengetik**
     (termasuk saat paste, karena tetap lewat `onChange`), jadi huruf tidak
     pernah benar-benar masuk ke state.
  2. `containsLetter()` — dicek lagi tepat sebelum submit sebagai guard
     terakhir; kalau true, `handleSave()` berhenti tanpa memanggil API dan
     menampilkan pesan error inline di bawah field.
  - Regex dibuat sebagai literal baru di setiap pemanggilan fungsi
    (bukan konstanta bersama dengan flag `g`), supaya `lastIndex` dari satu
    pemanggilan `.test()` tidak bocor ke pemanggilan berikutnya — bug klasik
    regex stateful yang mudah lolos review kalau regex-nya di-reuse.
- Field lain (First/Last Name, Email) tidak divalidasi format di
  client — divalidasi backend (WSO2 IS) saat `PUT`.
- Submit: `handleSave()` async, `setSaving(true)` di awal (disable tombol,
  ubah label), `finally setSaving(false)` — pola yang sama dipakai di
  seluruh modul lain (Notifikasi, Kategori Surat) untuk mencegah
  double-submit.

## 9. Routing dan Navigasi

Single-page module, tidak ada sub-route. Diakses via `/profil`, ditautkan
dari `DashboardUserMenu` (dropdown avatar header) item **"Account"**.

## 10. Middleware, Authentication, Authorization

- Dilindungi oleh guard yang sama seperti seluruh grup `(dashboard)` (lihat
  modul Authentication §10) — Proxy + guard `redirect("/login")` di layout.
- Tidak ada aturan otorisasi khusus per-role di modul ini: semua role bisa
  mengedit data akunnya sendiri (`akun-saya` adalah endpoint self-service,
  bukan admin). Role Name ditampilkan read-only bukan karena RBAC di
  frontend, tapi karena backend memang tidak mengizinkan user mengubah
  role-nya sendiri lewat endpoint ini.

## 11. Library/Package yang Digunakan

| Package | Fungsi |
|---|---|
| `lucide-react` (`LockIcon`) | Indikator visual field read-only. |
| `@/components/ui/{button,input,card,avatar,badge}` | Komponen UI dasar (lihat §12). |
| `@/lib/toast-manager` | Notifikasi hasil submit. |

Tidak ada library form/validasi eksternal (React Hook Form, Zod, dst.) —
validasi cukup sederhana (satu field) sehingga ditangani manual dengan
`useState` + fungsi murni.

## 12. Reusable/Shared Component

- `Card`/`CardContent`, `Avatar`/`AvatarFallback`/`AvatarImage`, `Badge`,
  `Button`, `Input` — komponen UI generik dari `src/components/ui/`,
  dipakai ulang di seluruh aplikasi.
- `getUserDisplay()` — sumber tunggal untuk avatar+nama+role+warna,
  dipakai identik di header dan sidebar (lihat modul Authentication).
- `ProfileField` **tidak** diekstrak ke `components/ui/` — sengaja tetap
  lokal di `akun-saya-form.tsx` karena bentuknya (grid label+input dengan
  breakpoint spesifik halaman ini) belum terbukti dibutuhkan modul lain;
  ekstraksi prematur ke shared component dihindari sampai ada kebutuhan
  nyata kedua.

## 13. Catatan Implementasi & Hal yang Perlu Diperhatikan

1. **Layout responsif 3 tahap** (mobile → tablet → desktop) adalah hasil
   iterasi eksplisit dari permintaan user: awalnya desktop-only 3-kolom,
   lalu dibuat mobile-responsive, lalu **tablet secara khusus diminta
   berperilaku seperti mobile** (susun vertikal), bukan versi sempit dari
   grid desktop. Ini sebabnya breakpoint yang dipakai adalah `lg:`
   (bukan `md:`) untuk grid 3-kolom — jangan diubah ke `md:` tanpa
   menyadari keputusan ini akan mengembalikan perilaku yang eksplisit
   ditolak sebelumnya.
2. **Kartu kiri dan kanan dibuat sama tinggi** (`h-full` pada `Card`,
   parent `grid` yang menyamakan tinggi baris) — permintaan eksplisit
   ("card nya menjadi sama rata"), bukan default Tailwind grid.
3. **Setelah submit sukses, `user` di `AuthContext` (header/sidebar) TIDAK
   otomatis ter-update** — form ini hanya memperbarui data di
   `/api/v1/akun-saya` backend, bukan `AuthContext.user` di client (yang
   sumbernya klaim `id_token`/`userinfo`, bukan tabel akun-saya). Kalau ke
   depannya field yang bisa diedit di sini (mis. nama) juga perlu tampil
   sinkron di header tanpa reload, perlu tambahan: refresh `user` context
   secara manual setelah `handleSave()` sukses, atau terima bahwa
   perubahan baru terlihat di header setelah reload/login ulang.
4. **`getAkunSaya()` bersifat best-effort** (`try/catch` → `null`) —
   sama seperti pola di seluruh modul lain. Kalau `akun === null` (backend
   tidak terjangkau), form tetap render dengan field editable kosong
   (`akun?.firstName ?? ""`), bukan halaman error. Perhatikan ini saat
   menambah field baru: selalu beri fallback aman, jangan asumsikan
   `akun` pasti ada.
5. **Ada `console.log` debug** (`"getAkunSaya() dipanggil"`) yang tertinggal
   di `getAkunSaya()` — tidak berpengaruh ke fungsi, tapi sebaiknya
   dibersihkan saat menyentuh file ini lagi karena bukan bagian dari
   desain yang disengaja.
