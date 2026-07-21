# Modul Notifikasi

## 1. Tujuan dan Fungsi Modul

Menyediakan dua permukaan untuk notifikasi in-app pengguna, berbagi logika
dan tampilan yang sama:

1. **Dropdown lonceng** di header dashboard (`NotificationsMenu`) — pratinjau
   cepat (3 item terbaru) + badge jumlah belum dibaca, bisa diakses dari
   halaman mana pun.
2. **Halaman penuh** `/notifikasi` (`NotifikasiList`) — daftar lengkap dengan
   filter kategori/status baca dan paginasi "muat lebih banyak".

Kontrak API: `documentation/note/api/02-dashboard-dan-self-service.md#modul-notifikasi`.
Tiga kategori notifikasi: `PENUGASAN`, `STATUS`, `SISTEM`.

## 2. Alur Kerja (Flow)

### 2.1 Render awal (Server Component)

- **Header** — `(dashboard)/layout.tsx` memanggil `getNotifikasi({limit:3})`
  dan `getUnreadCount()` paralel bersama `getMenuSaya()`, meneruskan
  `initialItems`/`initialUnreadCount` ke `<NotificationsMenu>`. Data ini
  ikut di-render di **setiap** halaman dashboard (bagian dari layout), tidak
  spesifik ke `/notifikasi`.
- **Halaman `/notifikasi`** — `NotifikasiPage` memanggil `getNotifikasi({page:1})`
  (limit default 8) dan `getUnreadCount()` paralel, meneruskan
  `initialPage`/`initialUnreadCount` ke `<NotifikasiList>`.

### 2.2 Interaksi di dropdown lonceng (`NotificationsMenu`)

1. Klik ikon lonceng → buka `DropdownMenuContent` (base-ui `Menu`),
   menampilkan hingga 3 item terbaru + header dengan badge unread count +
   tombol "Tandai dibaca" + link "Lihat semua notifikasi →" ke `/notifikasi`.
2. **Titik indikator** di setiap item (biru/hijau/amber sesuai kategori, abu
   kalau sudah dibaca) bisa diklik untuk menandai satu notifikasi dibaca:
   - Optimistic update: state lokal langsung diubah (`isRead: true`,
     `unreadCount - 1`) **sebelum** respons API datang, supaya terasa
     instan.
   - `PUT /api/proxy/notifikasi/{id}/read`.
   - Gagal (network error atau `!res.ok`) → rollback state ke sebelumnya.
3. **"Tandai dibaca"** (semua) → `PUT /api/proxy/notifikasi/read-all`,
   sukses → semua item lokal di-set `isRead: true`, `unreadCount = 0`.
   Tombol disable kalau `unreadCount === 0` atau sedang proses.

### 2.3 Interaksi di halaman penuh (`NotifikasiList`)

Superset dari §2.2, plus:

1. **Filter kategori** (`DropdownMenuRadioGroup`: Semua / Belum Dibaca /
   Penugasan / Status / Sistem) → `handleFilterChange()` mem-fetch ulang
   halaman 1 dengan query baru (`is_read=false` untuk "Belum Dibaca",
   `kategori=X` untuk kategori spesifik), **menggantikan** `items` (bukan
   menambah).
2. **"Muat Lebih Banyak"** → `handleLoadMore()` fetch halaman berikutnya
   (`pagination.page + 1`) dengan filter yang sedang aktif, **menambahkan**
   hasil ke `items` yang sudah ada (`[...prev, ...page.items]`). Disable
   otomatis kalau `pagination.page >= pagination.totalPages`.
3. Tandai-satu dan tandai-semua bekerja identik dengan dropdown (kode
   duplikat sengaja — lihat §13).

## 3. Struktur Folder dan File

```
src/
├── app/(dashboard)/notifikasi/
│   ├── page.tsx                        # Server Component — fetch awal
│   └── _components/
│       └── notifikasi-list.tsx         # Client Component — daftar penuh + filter + paginasi
├── components/
│   └── notifications-menu.tsx          # Client Component — dropdown lonceng di header
└── lib/
    ├── notifikasi.ts                   # Types + getNotifikasi()/getUnreadCount() (server helper)
    └── notifikasi-display.ts           # KATEGORI_META + formatWaktuNotifikasi (shared display logic)
```

`(dashboard)/layout.tsx` merangkai `NotificationsMenu` ke dalam header —
lihat modul Authentication untuk konteks layout dashboard secara umum.

## 4. Komponen dan Tanggung Jawab

| Komponen | Tanggung jawab |
|---|---|
| `NotifikasiPage` | Server Component: fetch halaman 1 + unread count, teruskan sebagai props. |
| `NotifikasiList` | Client Component: state daftar+paginasi+filter, semua aksi (filter/load-more/mark-read). |
| `NotificationsMenu` | Client Component: versi ringkas (pratinjau 3 item) dari perilaku yang sama, ditempel di header. |

## 5. Hook yang Digunakan

Keduanya (`NotifikasiList`, `NotificationsMenu`) murni `useState`, tidak ada
`useEffect`:

- `NotifikasiList`: `items`, `pagination`, `unreadCount`, `filter`,
  `loadingMore`, `markingAll`.
- `NotificationsMenu`: `items`, `unreadCount`, `markingAll`.

Tidak ada `useEffect` karena data awal selalu datang dari props (hasil fetch
Server Component) — tidak ada fetch-on-mount di client. Aksi baru terjadi
sebagai respons event user (klik filter/tombol), ditangani langsung di
event handler `async function`.

## 6. Cara Pengambilan Data dari API

**Server → backend** (initial render, lewat `fetchBackend`, lihat modul
Authentication §6):

| Fungsi | Endpoint |
|---|---|
| `getNotifikasi(filter)` | `GET /api/v1/notifikasi?kategori=&is_read=&page=&limit=` |
| `getUnreadCount()` | `GET /api/v1/notifikasi/unread-count` |

**Client → proxy → backend** (semua aksi setelah render awal):

| Aksi | Endpoint |
|---|---|
| Fetch ulang/filter/load-more (`NotifikasiList` saja) | `GET /api/proxy/notifikasi?...` |
| Tandai satu dibaca | `PUT /api/proxy/notifikasi/{id}/read` |
| Tandai semua dibaca | `PUT /api/proxy/notifikasi/read-all` |

`NotificationsMenu` (dropdown) **tidak** melakukan fetch ulang daftar —
hanya menerima `initialItems` sekali dari layout dan memutakhirkannya secara
lokal (optimistic) saat mark-as-read. Untuk melihat item baru di luar 3
yang awal, user harus buka `/notifikasi`.

## 7. State Management

Lokal per-komponen (`useState`), tidak ada state global/shared antara
`NotificationsMenu` dan `NotifikasiList` — keduanya independen meski
menampilkan data yang secara logis "sama". Konsekuensinya dicatat di §13
(item 1).

## 8. Validasi Form dan Mekanisme Submit

Tidak ada form input di modul ini (tidak ada create/edit notifikasi dari
frontend — notifikasi dibuat backend). "Submit" di sini terbatas pada aksi
mark-as-read/mark-all-read, keduanya idempoten di sisi backend (aman
di-retry/dipanggil ulang tanpa efek samping berbeda) — karena itu pola
**optimistic update** dipakai dengan percaya diri: risiko UI "salah tampil
sebentar" lebih murah daripada menunggu roundtrip network sebelum update
titik indikator.

## 9. Routing dan Navigasi

- `/notifikasi` — halaman penuh, satu route datar (tidak ada sub-route).
- Ditautkan dari:
  - `DashboardUserMenu` (dropdown avatar) → item **"Notifications"**.
  - `NotificationsMenu` sendiri → link **"Lihat semua notifikasi →"** di
    footer dropdown.
- `item.linkLabel` (field dari API, mis. "Lihat Surat") di
  `NotifikasiList` saat ini **`href="#"`** — belum ditautkan ke halaman
  tujuan sebenarnya (lihat §13 item 2).

## 10. Middleware, Authentication, Authorization

Dilindungi oleh guard `(dashboard)` yang sama seperti seluruh modul lain
(lihat modul Authentication §10). Tidak ada aturan otorisasi khusus —
notifikasi selalu personal (backend memfilter berdasarkan user pemilik
token), tidak ada akses lintas-user dari sisi frontend.

## 11. Library/Package yang Digunakan

| Package | Fungsi |
|---|---|
| `lucide-react` | Ikon (`BellIcon`, `ChevronDownIcon`, `Loader2Icon` untuk loading spinner, ikon kategori dari `KATEGORI_META`). |
| `@/components/ui/dropdown-menu` (base-ui `Menu`) | Dropdown lonceng dan dropdown filter kategori. |
| `@/lib/utils` (`cn`) | Gabung className kondisional (warna badge kategori, highlight item belum dibaca). |
| `@/lib/toast-manager` | Notifikasi error saat fetch/mark-read gagal. |

## 12. Reusable/Shared Component

- **`KATEGORI_META`** ([notifikasi-display.ts](../../../src/lib/notifikasi-display.ts)) —
  satu sumber kebenaran untuk label, ikon (`lucide-react`), warna badge, dan
  warna titik indikator per kategori (`PENUGASAN`/`STATUS`/`SISTEM`).
  Dipakai identik oleh `NotificationsMenu` dan `NotifikasiList` — mengubah
  tampilan kategori (mis. ganti warna) hanya perlu diubah di satu tempat.
- **`formatWaktuNotifikasi()`** — format tanggal+jam ala Indonesia
  (`DD MMM YYYY · HH:mm`), dipakai di kedua tempat yang sama.
- `DropdownMenu`/`DropdownMenuContent`/`DropdownMenuRadioGroup` dari
  `components/ui/dropdown-menu` — komponen generik dipakai ulang untuk dua
  jenis dropdown yang berbeda perilaku (lonceng vs filter).

## 13. Catatan Implementasi & Hal yang Perlu Diperhatikan

1. **Duplikasi logika antara `NotificationsMenu` dan `NotifikasiList`**:
   `handleMarkOneRead`/`handleMarkAllRead` ditulis dua kali (identik) di
   kedua komponen, alih-alih diekstrak ke custom hook bersama (mis.
   `useNotifikasiActions`). Ini keputusan sadar untuk saat ini karena kedua
   komponen punya *state* independen (`items`/`unreadCount` masing-masing
   tidak saling sinkron) — mengekstrak logic tanpa menyatukan state hanya
   memindah duplikasi, tidak menghilangkannya. **Konsekuensi nyata**: kalau
   user menandai satu notifikasi dibaca dari dropdown, badge unread count di
   halaman `/notifikasi` (kalau sedang terbuka di tab lain atau belum
   di-refresh) **tidak** ikut berubah, dan sebaliknya. Kalau ini jadi
   masalah UX, pertimbangkan mengangkat state ke context/global store atau
   memakai library data-fetching dengan cache invalidation (React Query/SWR)
   alih-alih dua `useState` independen.
2. **`item.linkLabel` di halaman penuh belum tertaut** (`href="#"`) — field
   ini sudah dikirim backend (mis. label "Lihat Surat") tapi frontend belum
   punya mapping `refTable`/`refId` → path halaman tujuan. Perlu diisi kalau
   fitur "klik notifikasi → lompat ke surat/entitas terkait" diminta.
3. **Limit berbeda antara dropdown (3) dan halaman penuh (8, konstanta
   `LIMIT` di `notifikasi-list.tsx`)** — sengaja, dropdown adalah pratinjau
   cepat bukan daftar lengkap. Kalau angka ini perlu diubah, dropdown diatur
   di `layout.tsx` (`getNotifikasi({limit:3})`), halaman penuh di konstanta
   `LIMIT` — dua tempat berbeda, bukan satu konfigurasi bersama.
4. **Optimistic update tanpa dependensi ke response body** — setelah mark
   read/read-all sukses, state lokal diubah berdasarkan asumsi (`isRead:
   true` untuk semua/satu item), bukan berdasarkan data yang dikembalikan
   backend. Ini aman selama backend memang idempoten dan tidak mengembalikan
   data lain yang relevan; kalau backend mulai mengembalikan field baru
   (mis. `readAt` server-side yang berbeda dari waktu klik), pertimbangkan
   memakai `body.data` dari response untuk update state alih-alih asumsi
   lokal.
