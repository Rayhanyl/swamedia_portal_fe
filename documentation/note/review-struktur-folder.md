# Review Struktur Folder — Swamedia Portal FE

Dokumen ini berisi hasil peninjauan struktur folder proyek terhadap konvensi resmi Next.js (App Router, versi 16.2.10 — lihat `node_modules/next/dist/docs/`) dan praktik umum proyek Next.js + shadcn/ui skala menengah-besar.

## 1. Kesimpulan Umum

Secara fondasi, struktur sudah **cukup baik** dan mengikuti pola yang direkomendasikan Next.js (App Router + `src/` folder + pemisahan folder per-concern). Kekurangan yang ada bersifat **konsistensi penamaan** dan **beberapa konvensi App Router yang belum dimanfaatkan**, bukan kesalahan fundamental.

## 2. Yang Sudah Sesuai Best Practice

- ✅ Menggunakan folder `src/` untuk memisahkan kode aplikasi dari file konfigurasi root — direkomendasikan resmi oleh Next.js.
- ✅ `proxy.ts` diletakkan di `src/` sejajar dengan `app/` — sesuai konvensi Next.js 16 (pengganti `middleware.ts`).
- ✅ Path alias `@/*` → `./src/*` sudah dikonfigurasi di `tsconfig.json` dan konsisten dengan alias di `components.json` (shadcn).
- ✅ Pemisahan `components/ui` (komponen hasil generate shadcn) dan `components/layout` (komponen layout kustom) — pola umum yang baik.
- ✅ Sudah menyiapkan folder per-concern: `constants`, `features`, `hooks`, `lib`, `services`, `store`, `types`, `utils` — cocok untuk aplikasi skala menengah-besar seperti portal manajemen proyek ini.
- ✅ Spesifikasi API (`documentation/openapi/swamedia_portal_openapi.yaml`) disimpan di dalam repo — memudahkan sinkronisasi kontrak FE-BE.

## 3. Kekurangan & Rekomendasi

### 3.1 Penamaan folder route di `src/app` tidak konsisten

Saat ini folder route bercampur antara Bahasa Indonesia/Inggris dan snake_case/flat:

| Folder saat ini | Bahasa | Format |
|---|---|---|
| `contact` | Inggris | flat |
| `customer` | Inggris | flat |
| `daftar_surat` | Indonesia | snake_case |
| `industri` | Indonesia | flat |
| `kategori_surat` | Indonesia | snake_case |
| `resources_tags` | Inggris | snake_case |
| `tags` | Inggris | flat |
| `unit` | Inggris | flat |

**Masalah:**
- Next.js/URL best practice merekomendasikan **kebab-case** untuk segmen URL multi-kata (`kategori-surat`, bukan `kategori_surat`), karena underscore pada URL kurang lazim dan kurang SEO-friendly.
- Campur bahasa Indonesia dan Inggris pada level yang sama membuat URL tidak konsisten, mis. `/industri` (ID) tapi `/customer` (EN).

**Rekomendasi:** pilih satu bahasa dan satu format penamaan, misalnya seluruhnya Inggris + kebab-case: `customers`, `contacts`, `units`, `industries`, `tags`, `letter-categories` (`kategori-surat`), `letter-list` (`daftar-surat`), `resource-tags`. Terapkan konsisten ke semua route baru berikutnya.

### 3.2 `resources_tags` tidak sinkron dengan nama resource di OpenAPI

Backend mendefinisikan endpoint `/api/v1/master/resource-tags` (singular "resource", kebab-case), sedangkan folder FE bernama `resources_tags` (plural "resources", snake_case). Perbedaan ini berisiko membingungkan saat menghubungkan halaman ke service/API layer.

**Rekomendasi:** samakan menjadi `resource-tags` agar 1:1 dengan nama resource backend, atau dokumentasikan pemetaan nama jika sengaja dibedakan.

### 3.3 Singular vs plural tidak konsisten

`customer`, `unit`, `industri`, `contact` ditulis singular, padahal masing-masing adalah halaman listing/manajemen banyak data (dan backend memakai bentuk plural: `customers`, `units`, `industries`, `contacts`). Sementara `tags` sudah plural.

**Rekomendasi:** gunakan bentuk plural secara konsisten untuk route yang merepresentasikan koleksi data (list/table), sejalan dengan penamaan resource di OpenAPI.

### 3.4 Belum memanfaatkan Route Groups untuk memisahkan layout

Semua route (`dashboard`, `customer`, `unit`, `industri`, `tags`, dst.) berada flat langsung di bawah `app/`, sementara halaman login dirender di `app/page.tsx` (root `/`). Karena ini adalah portal internal dengan banyak halaman manajemen data yang kemungkinan besar berbagi shell yang sama (sidebar, topbar, autentikasi), struktur flat ini akan sulit di-scale begitu setiap halaman butuh layout dashboard yang sama.

**Rekomendasi:** gunakan [route groups](https://nextjs.org) untuk memisahkan area publik dan area yang butuh autentikasi tanpa memengaruhi URL, contoh:

```
src/app/
├── (auth)/
│   └── login/page.tsx        →  /login
├── (dashboard)/
│   ├── layout.tsx            →  shared sidebar/topbar untuk semua halaman berikut
│   ├── dashboard/page.tsx    →  /dashboard
│   ├── customers/page.tsx    →  /customers
│   ├── units/page.tsx        →  /units
│   ├── industries/page.tsx   →  /industries
│   ├── tags/page.tsx         →  /tags
│   ├── resource-tags/page.tsx
│   ├── letter-categories/page.tsx
│   └── contacts/page.tsx
```

Ini juga membuat `app/page.tsx` (halaman login saat ini) bisa dipindah ke `(auth)/login`, sehingga root `/` bisa jadi entry point yang redirect sesuai status login lewat `proxy.ts`.

### 3.5 File konvensi App Router belum dipakai

Belum ada `loading.tsx`, `error.tsx`, atau `not-found.tsx` di level manapun. Untuk portal dengan banyak halaman data (tabel, form), ini penting agar ada skeleton loading dan error boundary yang konsisten, alih-alih layar putih/kosong saat fetch data lambat atau gagal.

**Rekomendasi:** tambahkan minimal `app/error.tsx`, `app/not-found.tsx`, dan `loading.tsx` per grup route yang melakukan data fetching (mis. di dalam `(dashboard)/customers/loading.tsx`).

### 3.6 Potensi tumpang tindih `src/lib` vs `src/utils`

Konvensi shadcn sudah menaruh helper di `src/lib/utils.ts` (alias `lib` dan `utils` di `components.json` bahkan menunjuk ke path yang sama: `@/lib`). Adanya folder `src/utils` terpisah berisiko menimbulkan ambiguitas: developer baru bisa bingung menaruh helper baru di `lib` atau `utils`.

**Rekomendasi:** pilih salah satu sebagai sumber kebenaran tunggal untuk utility function, misalnya:
- `src/lib` → helper generik + integrasi library eksternal (termasuk `utils.ts` milik shadcn).
- Hapus/gabungkan `src/utils` ke `src/lib`, **atau** definisikan pembagian tugas yang jelas (mis. `lib` = wrapper library pihak ketiga, `utils` = pure function murni) dan tuliskan di README/CLAUDE.md agar tim konsisten.

### 3.7 Kejelasan fungsi `src/app/api`

Folder `app/api` masih kosong. Karena aplikasi ini mengonsumsi backend eksternal (lihat `documentation/openapi/swamedia_portal_openapi.yaml`), perlu diputuskan lebih dulu apakah `app/api` akan dipakai sebagai:
- **BFF/proxy layer** (Route Handler meneruskan request ke backend, menyembunyikan token/kredensial dari client), atau
- Tidak dipakai sama sekali jika semua pemanggilan API cukup dilakukan langsung dari Server Component/`src/services` ke backend.

**Rekomendasi:** jika dipakai sebagai BFF, samakan sub-folder di `app/api` dengan nama resource backend (`app/api/customers`, `app/api/units`, dst.) agar mudah ditelusuri. Jika tidak dipakai, pertimbangkan menghapus folder ini sampai benar-benar dibutuhkan agar struktur tidak menyesatkan.

### 3.8 `page.tsx` root (halaman login) seluruhnya `"use client"`

`src/app/page.tsx` men-declare seluruh halaman sebagai Client Component, padahal sebagian besar kontennya (panel kiri: judul, teks, statistik) statis dan tidak butuh interaktivitas. Hanya form login (toggle show/hide password) yang butuh client-side state.

**Rekomendasi:** jadikan `page.tsx` Server Component, lalu pecah form login ke komponen terpisah (mis. `components/layout/login-form.tsx` atau setelah route group: `(auth)/login/_components/login-form.tsx`) yang diberi `"use client"`. Ini konsisten dengan prinsip App Router: client boundary sekecil mungkin.

## 4. Contoh Struktur Folder Target (setelah perbaikan)

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx
│   │       └── _components/login-form.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── units/page.tsx
│   │   ├── industries/page.tsx
│   │   ├── tags/page.tsx
│   │   ├── resource-tags/page.tsx
│   │   ├── letter-categories/page.tsx
│   │   └── contacts/page.tsx
│   ├── layout.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css
├── components/
│   ├── ui/          # hasil generate shadcn
│   └── layout/       # sidebar, topbar, dll.
├── constants/
├── features/         # opsional: logic per-domain jika dipakai pola feature-sliced
├── hooks/
├── lib/              # utilities + wrapper library eksternal
├── services/         # pemanggilan API ke backend (selaras dengan OpenAPI)
├── store/
├── types/            # idealnya digenerate dari documentation/openapi/*.yaml
└── proxy.ts
```

## 5. Referensi

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md` — konvensi struktur folder App Router (Next.js 16).
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` — konvensi `proxy.ts` (pengganti `middleware.ts`).
- `node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md` — pola BFF dengan Route Handler + Proxy.
- `documentation/openapi/swamedia_portal_openapi.yaml` — kontrak resource backend untuk penyelarasan nama route/service.
