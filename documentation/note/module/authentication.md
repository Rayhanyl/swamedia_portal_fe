# Modul Authentication

## 1. Tujuan dan Fungsi Modul

Modul ini menangani seluruh siklus hidup sesi pengguna di Swamedia Portal:
login, penyimpanan token, proactive refresh, propagasi token ke setiap
panggilan API bisnis, dan logout. Backend identitasnya adalah **WSO2
Identity Server (IS)**, dijembatani oleh Ballerina backend
(`swamedia_portal_be`) — frontend tidak pernah bicara langsung ke WSO2 IS.

Referensi kontrak API: `documentation/note/api/01-autentikasi.md`.

Prinsip desain utama: **token mentah (access/refresh/id token) tidak pernah
boleh menyentuh JavaScript di browser.** Semua token disimpan sebagai cookie
`httpOnly`, ditulis dan dibaca hanya oleh kode server Next.js (Route
Handler, Proxy, Server Component). Client Component hanya melihat objek
`user` (klaim, bukan token).

## 2. Alur Kerja (Flow)

### 2.1 Login

1. User mengisi form di `/login` ([login-form.tsx](../../../src/app/(auth)/login/_components/login-form.tsx)) dan submit.
2. `LoginForm` memanggil `useAuth().login(username, password)` dari
   [auth-context.tsx](../../../src/context/auth-context.tsx).
3. `login()` melakukan `fetch("/api/login", { method: "POST" })` — **same-origin**,
   bukan langsung ke backend.
4. Route Handler [`/api/login/route.ts`](../../../src/app/api/login/route.ts) menerima
   `{ username, password }`, meneruskannya ke
   `POST {BACKEND_BASE_URL}/api/v1/auth/login`.
   - Jika backend membalas gagal (`!success`), Route Handler mengembalikan
     `{ message, code }` dari `body.errors` dengan status aslinya (mis. 401,
     403) — **tidak** pernah mengubah pesan/kode backend.
   - Jika sukses, `setSessionCookies(body.data)` dipanggil untuk menulis
     cookie sesi (lihat §3), lalu Route Handler membalas
     `{ user: body.data.user }` — **hanya objek user, tidak ada token apa
     pun** yang dikirim ke browser.
5. Di client, `login()` menyimpan `user` ke React state (`AuthProvider`) dan
   menampilkan toast sukses.
6. `LoginForm` melakukan **hard navigation**
   (`window.location.assign(dest)`), bukan `router.push`/`router.refresh`.
   Ini sengaja: cookie sesi baru saja diubah oleh Route Handler di luar
   sepengetahuan Next.js router cache, dan soft navigation sempat
   menghasilkan render pertama dengan data tidak lengkap (mis. sidebar
   menu kosong) sebelum membaik sendiri. Full page load menyamakan
   perilakunya dengan refresh manual: satu request bersih dengan cookie
   yang sudah pasti ter-commit.
7. Redirect tujuan (`dest`) diambil dari query param `?from=` (asal
   sebelum di-redirect ke `/login`) jika ada dan aman (path internal,
   bukan `//...`), fallback ke `/dashboard`.

### 2.2 Proactive token refresh (setiap navigasi halaman)

Ditangani oleh **Next.js Proxy** — [`src/proxy.ts`](../../../src/proxy.ts), pengganti
`middleware.ts` di versi Next.js ini (lihat catatan di `AGENTS.md`). Proxy
berjalan **sebelum** Server Component di-render, untuk setiap request yang
cocok `matcher` (semua path kecuali `/api/*`, aset statis, dan `/login`):

1. Baca cookie `swamedia_access_token` dan `swamedia_refresh_token`.
2. `isJwtExpiringSoon(accessToken)` — decode lokal (tanpa verifikasi
   signature) untuk membaca klaim `exp`; true jika sudah lewat atau akan
   lewat dalam 60 detik ke depan.
3. Jika **tidak** perlu refresh → `NextResponse.next()`, lanjut seperti biasa.
4. Jika perlu refresh tapi **tidak ada** refresh token → redirect ke
   `/login?from=<path asal>`, hapus semua cookie sesi jika access token
   sebelumnya ada (sesi memang berakhir, bukan cuma belum pernah login).
5. Jika ada refresh token → `refreshAccessToken(refreshToken)` (POST
   `/api/v1/auth/refresh` ke backend). Jika backend menolak → redirect ke
   `/login` dengan cookie dihapus. Jika berhasil → tulis ulang cookie sesi
   lewat `applySessionCookies()` pada `NextResponse` yang diteruskan.

Server Component (`getServerUser`, `getMenuSaya`, dst.) **tidak** melakukan
refresh sendiri — mereka mengandalkan Proxy sudah menjamin access token di
cookie fresh sebelum request sampai ke Server Component. Ini karena Server
Component tidak bisa menulis cookie (`cookies().set()` selalu `throw` di luar
Route Handler/Server Action), jadi mencoba refresh di sana hanya akan
membakar refresh token tanpa bisa menyimpan hasilnya.

### 2.3 Panggilan API bisnis dari Client Component

Client Component tidak pernah menyimpan/mengirim token sendiri. Semua mutasi
dari browser lewat `fetch("/api/proxy/<path>", ...)`, ditangani generic proxy
[`/api/proxy/[...path]/route.ts`](../../../src/app/api/proxy/[...path]/route.ts):

1. Ambil `accessToken`/`refreshToken` dari cookie.
2. Teruskan request ke `{BACKEND_BASE_URL}/api/v1/<path>` dengan header
   `Authorization: Bearer <accessToken>`, method & body asli diteruskan
   mentah (`req.text()`).
3. Jika backend membalas `401` **dan** ada refresh token → refresh sekali
   (`refreshAccessToken`), simpan cookie baru (`setSessionCookies`), lalu
   retry request yang sama dengan access token baru.
4. Jika refresh gagal → hapus semua cookie sesi, balas `401
   {success:false, message:"Session expired"}` ke client (client harus
   menangani ini, biasanya lewat toast error; belum ada auto-redirect
   khusus di layer proxy untuk kasus ini — halaman selanjutnya akan
   ditendang ke `/login` oleh Proxy pada navigasi berikutnya).
5. Response backend (apa pun bentuknya) diteruskan mentah ke client.

Server Component yang mengambil data langsung (bukan lewat proxy) memakai
[`fetchBackend()`](../../../src/lib/auth/fetch-backend.ts) — server-to-server langsung ke
backend, **tanpa** retry-on-401 (sengaja, lihat §2.2).

### 2.4 Rehydrate user setelah reload

`getServerUser()` ([server-user.ts](../../../src/lib/auth/server-user.ts)) dipanggil dari
root layout dashboard untuk membangun objek `user` yang akan jadi
`initialUser` bagi `AuthProvider`. Menggabungkan tiga sumber (spread
berurutan, yang belakangan menang kalau field sama):

1. `idTokenClaims` — decode lokal `swamedia_id_token` (klaim OIDC lain yang
   tidak ikut di `/userinfo`, mis. `given_name`/`family_name`/`username`).
2. `userinfoData` — `GET /api/v1/auth/userinfo` (klaim OIDC standar:
   `sub`/`email`/`name`/`swaportal_role_id`).
3. `roleNameClaim` — dari cookie `swamedia_role_name` (lihat §3, field ini
   **tidak** ada di idToken maupun `/userinfo`).

Mengembalikan `null` hanya jika ketiga sumber kosong (bukan objek kosong),
supaya `AuthProvider` tahu user benar-benar belum terautentikasi.

### 2.5 Logout

1. `useAuth().logout()` → `fetch("/api/logout", { method: "POST" })`.
2. [`/api/logout/route.ts`](../../../src/app/api/logout/route.ts): kirim `idToken` +
   `accessToken` ke `POST /api/v1/auth/logout` backend (best-effort — gagal
   pun tetap lanjut, supaya user tidak "terjebak login" di browser sendiri
   kalau backend/WSO2 IS tidak terjangkau), lalu `clearSessionCookies()`.
3. Client set `user = null`, tampilkan toast, tunggu 600ms (supaya toast
   sempat terlihat), lalu `window.location.href = "/login"` (hard
   navigation, alasan sama seperti login).

## 3. Struktur Folder dan File

```
src/
├── proxy.ts                          # Next.js Proxy — proactive refresh + redirect /login
├── context/
│   └── auth-context.tsx              # AuthProvider/useAuth — state user di client
├── app/
│   ├── (auth)/login/
│   │   ├── page.tsx                  # Server Component — panel brand + redirect kalau sudah login
│   │   └── _components/login-form.tsx
│   ├── api/
│   │   ├── login/route.ts            # Satu-satunya tempat browser kirim username/password
│   │   ├── logout/route.ts
│   │   └── proxy/[...path]/route.ts  # Generic proxy semua panggilan bisnis client
└── lib/auth/
    ├── constants.ts                  # Nama cookie & SESSION_COOKIE_OPTIONS
    ├── session-cookies.ts            # set/get/clearSessionCookies (Route Handler/Server Component)
    ├── refresh-token.ts              # refreshAccessToken() — dipakai proxy.ts & route.ts proxy
    ├── fetch-backend.ts              # fetchBackend() — server-to-server, tanpa retry
    ├── decode-jwt.ts                 # getJwtPayload/getJwtExpiry/isJwtExpiringSoon (tanpa verifikasi signature)
    ├── server-user.ts                # getServerUser() — rehydrate user gabungan 3 sumber
    ├── user-display.ts               # getUserDisplay() — normalisasi AuthUser → UserDisplay siap-render
    ├── role-color.ts                 # getRoleAvatarColor(roleId) — warna avatar per role
    └── login-error.ts                # class LoginError (message + code dari backend)
```

## 4. Komponen dan Tanggung Jawab

| Komponen/Modul | Tanggung jawab |
|---|---|
| `AuthProvider` / `useAuth` | Satu-satunya sumber `user` di client; expose `login()`/`logout()`. |
| `LoginForm` | Form terkontrol (username/password/show-password), memanggil `login()`, menampilkan error (beda gaya untuk `FORBIDDEN` vs error lain). |
| `LoginPage` | Server Component: redirect ke `/dashboard` kalau sudah punya `accessToken`; render panel brand statis + ringkasan dashboard (`getDashboardSummary`). |
| `proxy.ts` (`proxy()`) | Gate setiap navigasi halaman: refresh token proaktif atau redirect ke login. |
| `/api/login` Route Handler | Proxy login credential ke backend + `setSessionCookies`; **tidak pernah** mengembalikan token ke browser. |
| `/api/logout` Route Handler | Invalidasi sesi di backend (best-effort) + hapus cookie lokal. |
| `/api/proxy/[...path]` Route Handler | Titik tunggal yang menempelkan `Authorization` header ke request bisnis dari client + retry-on-401. |
| `getServerUser()` | Membangun objek `user` gabungan untuk `initialUser` server-side. |
| `getUserDisplay()` | Turunkan `{name, email, avatar, initials, roleLabel, avatarColorClassName}` dari `AuthUser` mentah — dipakai di header, sidebar, dan halaman profil supaya tampilan konsisten. |

## 5. Hook yang Digunakan

- `useState` — state form login (`LoginForm`), state `user` (`AuthProvider`).
- `useContext` (via `useAuth()`) — custom hook pembungkus `AuthContext`,
  melempar error jika dipanggil di luar `AuthProvider`.
- Tidak ada `useEffect`/`useMemo` di modul ini — semua fetching sesi terjadi
  di Server Component (`await`) atau dipicu langsung oleh event handler
  (`onSubmit`), bukan efek samping berbasis lifecycle.

## 6. Pengambilan Data dari API

| Fungsi | Arah | Endpoint backend |
|---|---|---|
| `POST /api/login` (Route Handler) | server → backend | `POST /api/v1/auth/login` |
| `POST /api/logout` (Route Handler) | server → backend | `POST /api/v1/auth/logout` |
| `refreshAccessToken()` | server → backend | `POST /api/v1/auth/refresh` |
| `getServerUser()` (via `fetchBackend`) | server → backend | `GET /api/v1/auth/userinfo` |

Tidak ada client-side fetch langsung ke backend — segalanya lewat Route
Handler (`/api/login`, `/api/logout`) atau generic proxy
(`/api/proxy/...`), never `fetch(BACKEND_BASE_URL, ...)` dari komponen
client.

## 7. State Management

Global state autentikasi memakai **React Context** murni
(`AuthContext`/`AuthProvider`), tidak ada Redux/Zustand/dsb. Dipilih karena
scope-nya kecil (`user`, `login`, `logout`) dan hanya perlu dibaca oleh
komponen di dalam `(dashboard)` layout — tidak butuh selector granular atau
persistensi client-side (persistensi sesungguhnya ada di cookie httpOnly,
bukan di state React).

`AuthProvider` diisi `initialUser` dari Server Component (`getServerUser()`
di root layout dashboard) — pola **hydration dari server**, bukan fetch di
client saat mount.

## 8. Validasi Form dan Mekanisme Submit

- Form login (`LoginForm`) tidak melakukan validasi client-side selain
  `required` implisit via disable saat `loading`; validasi kredensial
  sepenuhnya di backend/WSO2 IS.
- Error dibedakan lewat `LoginError.code`:
  - `code === "FORBIDDEN"` → box info biru (kredensial valid tapi akun belum
    jadi member portal — bukan kesalahan input).
  - Kode lain (mis. `UNAUTHORIZED`) → box error merah.
- Submit: `e.preventDefault()` → `await login(...)` → sukses lempar ke
  `dest` (hard navigation), gagal tangkap `LoginError` untuk pesan+kode,
  atau `Error` generic sebagai fallback.

## 9. Routing dan Navigasi

- `/login` — halaman publik, satu-satunya route yang dikecualikan dari
  Proxy (selain `/api/*` dan aset statis).
- Semua route lain (termasuk `/dashboard`) dijaga oleh Proxy: tanpa access
  token valid (atau refresh yang berhasil), user diarahkan ke
  `/login?from=<path asal>`.
- `(dashboard)/layout.tsx` juga memiliki guard redundan level Server
  Component: `if (!accessToken) redirect("/login")` — pertahanan berlapis
  kalau Proxy entah bagaimana tidak jalan untuk request tersebut.
- Navigasi pasca-login/logout sengaja **hard navigation**
  (`window.location.assign`/`.href`), bukan Next.js soft navigation — lihat
  alasan di §2.1 dan §2.5.

## 10. Middleware, Authentication, dan Authorization

- **Middleware**: `src/proxy.ts` adalah Next.js Proxy (bukan
  `middleware.ts` — nama & runtime berbeda di versi Next.js ini, lihat
  `AGENTS.md`). Default runtime Node.js, `matcher` mengecualikan
  `/api/*`, aset `_next`, `favicon.ico`, `/login`, dan file berekstensi.
- **Authentication**: WSO2 Identity Server via backend Ballerina
  (`/api/v1/auth/*`). Frontend tidak pernah menyimpan
  username/password, hanya meneruskannya sekali saat login.
- **Authorization**: role tunggal per user (`swaportal_role_id` +
  `swaportal_role_name`), ditentukan backend — frontend **tidak**
  mengimplementasikan role-switching (fitur "Lihat sebagai Role" di
  header sengaja read-only, single-role, karena backend hanya mendukung
  satu role per akun; switching akan jadi celah privilege-escalation).
  Enforcement authorization sesungguhnya (endpoint mana yang boleh
  diakses role apa) terjadi di backend; frontend hanya menyesuaikan
  tampilan (mis. menu sidebar dari `/api/v1/menu-saya`).

## 11. Library/Package yang Digunakan

| Package | Fungsi di modul ini |
|---|---|
| `next/navigation` (`redirect`) | Guard server-side di `LoginPage`/dashboard layout. |
| `next/headers` (`cookies`) | Baca/tulis cookie httpOnly di Route Handler & Server Component. |
| `next/server` (`NextResponse`, `NextRequest`) | Implementasi `proxy.ts` dan Route Handler. |
| `lucide-react` | Ikon form login (`User`, `Lock`, `Eye`/`EyeOff`, dst.). |
| Tidak ada library JWT eksternal | Decode JWT dilakukan manual (`Buffer.from(base64url)`) — sengaja, karena tidak perlu verifikasi signature (bukan gerbang keamanan, cuma sumber tampilan/keputusan refresh). |

## 12. Reusable/Shared Component

- `getUserDisplay()` — dipakai di header (`DashboardUserMenu`), sidebar
  (`AppSidebar`), dan halaman Profil Saya. Satu fungsi memastikan nama,
  inisial avatar, warna avatar per role, dan label role selalu konsisten
  di seluruh aplikasi.
- `getRoleAvatarColor()` — dipakai oleh `getUserDisplay()`, memetakan
  `swaportal_role_id` (1–5) ke pasangan warna bg+text Tailwind yang
  konsisten (lihat juga modul Notifikasi/Profil Saya yang menampilkan
  avatar yang sama).
- `LoginError` — dipakai satu-satunya oleh `LoginForm`, tapi didefinisikan
  di `lib/auth` supaya bisa dipakai ulang oleh komponen login lain di masa
  depan tanpa duplikasi shape error.

## 13. Catatan Implementasi & Hal yang Perlu Diperhatikan

1. **Empat cookie sesi**: `swamedia_access_token`, `swamedia_refresh_token`,
   `swamedia_id_token` (semuanya token asli dari WSO2 IS), dan
   `swamedia_role_name` (**bukan** token, titipan BE). `swaportal_role_name`
   ditambahkan backend saat login/refresh dan **tidak** merupakan klaim
   bawaan WSO2 IS — karena itu tidak bisa direkonstruksi dari decode
   idToken, harus disimpan di cookie terpisah dan ditulis ulang setiap kali
   login **maupun** refresh (lihat `setSessionCookies` dan
   `applySessionCookies` di `proxy.ts`). Kalau field ini hilang setelah
   reload, cek dulu apakah backend memang mengirim `user.swaportal_role_name`
   di response `/auth/login` atau `/auth/refresh` — bukan bug di frontend.
2. **Decode JWT lokal tanpa verifikasi signature** (`decode-jwt.ts`) hanya
   untuk kebutuhan UX (cek `exp`, baca klaim tampilan). Validitas
   sesungguhnya selalu diverifikasi backend lewat JWKS di setiap request
   bisnis. **Jangan** gunakan hasil decode ini untuk keputusan otorisasi apa
   pun — hanya untuk tampilan dan keputusan refresh.
3. **Kenapa `fetchBackend()` (Server Component) tidak retry-on-401** padahal
   proxy `/api/proxy/[...path]` melakukannya: `fetchBackend` dipanggil dari
   Server Component yang tidak bisa menulis cookie balasan. Refresh di sana
   hanya akan membakar refresh token tanpa bisa menyimpannya. Sebagai
   gantinya, `proxy.ts` sudah menjamin token fresh sebelum Server Component
   jalan. Kalau menambah pemanggilan backend baru dari Server Component,
   **jangan** menduplikasi logika retry — pakai `fetchBackend` yang sudah
   ada.
4. **Hard navigation setelah login/logout** bukan oversight — lihat
   penjelasan di §2.1/§2.5. Jangan diganti ke `router.push`/`router.refresh`
   tanpa menguji ulang kasus "render pertama dengan data kosong sebelum
   membaik sendiri" yang menyebabkan keputusan ini.
5. **`getServerUser`/`getMenuSaya`/`getAkunSaya`/dll bersifat best-effort**:
   kegagalan backend mengembalikan `null`/array kosong, tidak pernah
   `throw`, supaya render halaman tidak ikut gagal total karena satu
   panggilan data sekunder gagal. Konsekuensinya: setiap pemanggil fungsi
   ini harus menangani kasus kosong/`null` secara eksplisit di UI (lihat
   fallback `"-"` untuk username/roleName di halaman Profil Saya).
