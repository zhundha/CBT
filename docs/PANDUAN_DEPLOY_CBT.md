# Panduan Deploy CBT

## 1. Google Apps Script

1. Buat project Apps Script.
2. Masukkan isi `Code.gs` saja.
3. Jangan masukkan `index.html` ke Apps Script; backend ini mode `api-only`.
4. Pastikan `SHEET_ID` dan `FOLDER_ID` sudah sesuai.
5. Deploy sebagai Web App dengan akses yang dapat dipanggil frontend GitHub Pages.
6. Buka URL Web App di browser untuk cek health check JSON.
7. Akses awal menggunakan akun bawaan:
   - `admin / admin`
   - `proktor / proktor`
   - `pengawas1 / pengawas1`
   - `pengawas2 / pengawas2`

## 2. GitHub Pages

1. Upload `index.html` ke repository GitHub Pages.
2. Konstanta `BACKEND_URL` di bagian awal script `index.html` sudah diisi dengan URL Web App Apps Script.
3. Deploy GitHub Pages.
4. Frontend akan memanggil Apps Script lewat `fetch` ke API `doPost`.
5. Frontend tidak memakai `google.script.run`, `HtmlService`, atau file HTML Apps Script.

Contoh:

```js
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbw3HzU64qJ-YOF5e1z1jroFwjGL877OKwxoRZXPxGoXVynzrBIaMElBLwzP7_ZKdPJUWw/exec';
```

## 3. Sheet Yang Dibuat Otomatis

Saat aplikasi dipakai, backend akan membuat sheet:

- `Akun_Pengguna`
- `Master_Data`
- `Jadwal_Ujian`
- `Bank_Soal`
- `Jawaban`
- `Submit_Ujian`
- `Status_Peserta`
- `Daftar_Hadir`
- `Berita_Acara`
- `Kendala`
- `Nilai_Esai`
- `Log_Aktivitas`

## 4. Keamanan Login

- Aplikasi menampilkan splash screen biru sebelum halaman login sambil memeriksa sesi perangkat yang tersimpan.
- Halaman login memakai tab role `Siswa`, `Guru`, `Pengawas/Penguji`, `Proktor`, dan `Admin`.
- Tampilan frontend sudah dioptimalkan untuk mobile: safe-area ponsel, input 16px, tombol minimal 44px, tabel dapat digeser horizontal, dan tombol navigasi soal dibuat sticky saat ujian.
- Backend memvalidasi role yang dipilih saat login, sehingga username yang sama pada role berbeda tetap aman selama passwordnya berbeda.
- Akun baru dari dashboard admin disimpan ke `Akun_Pengguna` menggunakan `password_hash`.
- Role divalidasi ulang di backend melalui `sessionToken`.
- Login baru pada akun yang sama akan menonaktifkan sesi lama.
- Browser menyimpan `deviceId` lokal agar sesi dapat diaudit per perangkat.
- Akun bawaan legacy hanya aktif jika `Akun_Pengguna` masih kosong atau properti script `CBT_ALLOW_LEGACY_LOGIN` diset `true`/`YA`.

## 5. Format Impor Soal

Gunakan format TSV/CSV dengan header:

```tsv
nomor	tipe	pertanyaan	pilihanA	pilihanB	pilihanC	pilihanD	pilihanE	kunci	skorMaks
1	PG	Pertanyaan nomor 1	Pilihan A	Pilihan B	Pilihan C	Pilihan D	Pilihan E	A	1
51	ESAI	Pertanyaan esai nomor 51							10
```

Untuk standar konsep CBT, siapkan nomor `1-50` sebagai `PG` dan nomor `51-55` sebagai `ESAI`.

## 6. Utilitas Pelaksanaan

Dashboard proktor/admin memiliki tombol:

- `Cek Siap`: memeriksa apakah ujian CBT sudah memiliki 50 PG, 5 esai, kunci PG, token, dan durasi valid. Jadwal `Ujian Praktik` tidak memerlukan bank soal atau token CBT.
- `Rotasi Token`: mengganti token ujian terpilih atau semua ujian aktif.
- `Backup`: membuat salinan spreadsheet ke folder Drive `FOLDER_ID`.
- `CSV Nilai`: membuat file CSV rekap nilai di folder Drive `FOLDER_ID`.
- `CSV Jawaban`: membuat file CSV detail jawaban peserta per nomor soal di folder Drive `FOLDER_ID`.
- `PDF Laporan`: membuat laporan pelaksanaan berisi rekap ruang, peserta, berita acara, dan kendala.
- `Kunci Waktu Habis`: mengunci otomatis peserta yang timer servernya sudah habis memakai jawaban terakhir yang tersimpan.

Saat proktor/admin menekan `Buka`, backend akan menolak membuka ujian CBT jika struktur soal belum siap. Jadwal `Ujian Praktik` boleh dibuka tanpa cek bank soal.

## 7. Kendala Dan Audit Log

Dashboard petugas memiliki panel:

- `Daftar Kendala`: melihat laporan kendala dan pengajuan reset dari ruang ujian.
- `Setujui` / `Tolak`: proktor/admin dapat memproses pengajuan reset atau buka ulang dari pengawas/penguji.
- `Selesai`: proktor/admin dapat menandai kendala biasa selesai.
- `Log Aktivitas`: proktor/admin dapat melihat aktivitas penting seperti login, mulai ujian, submit, reset, rotasi token, backup, dan ekspor.

Pengawas/penguji hanya melihat kendala sesuai ruangnya. Proktor/admin dapat melihat semua ruang.

## 8. Pemulihan Sesi Siswa

Frontend menyimpan `sessionToken` di browser agar halaman dapat dipulihkan setelah refresh.

- Dashboard siswa menampilkan progres jawaban, jumlah ragu-ragu, sisa waktu, dan jumlah pindah tab.
- Jika ujian sudah pernah dimulai dan belum submit, siswa dapat memakai tombol `Lanjutkan` tanpa memasukkan token ulang.
- Backend tetap memvalidasi sesi, status ujian, kelas siswa, dan kunci submit.

## 9. Impor Akun Dan Master Data

Dashboard admin menyediakan:

- `Impor Akun Massal`: menambahkan siswa, guru, pengawas/penguji, proktor, dan admin ke `Akun_Pengguna` dengan password otomatis disimpan sebagai hash.
- `Isi Peserta`: mengisi otomatis 238 akun peserta PSAT dari dataset peserta didik. Username memakai `NISN`; password siswa diperbarui dari dataset password resmi dan disimpan sebagai `password_hash`.
- `Isi Staff`: mengisi otomatis akun proktor, guru, dan pengawas/penguji dari dataset resmi. Beberapa username yang sama lintas-role disimpan sebagai akun berbeda berdasarkan kombinasi `username + role`.
- `Master Data`: mencatat jenis ujian, kelas/jenjang, ruang, mapel, dan guru ke `Master_Data`.
- `Isi PSAT`: mengisi otomatis master `PSAT` untuk kelas `X` dan `XI`, lengkap dengan relasi mapel dan guru.

Jadwal ujian memakai dropdown dari master data: pilih `jenis`, `kelas/jenjang`, `mapel`, lalu guru akan terisi sesuai mapel yang dipilih. Template data PSAT tersedia di `template-master-psat.tsv`.

Format impor akun/peserta:

```tsv
nama	user	password	kelas	role	ruang	status	nomorUjian	jenisKelamin	jurusan
Siswa Contoh	0090000000		XI PH	siswa	Ruang 1	aktif	18.05-05.06/PSAT/26/000	L	Perhotelan
Guru Mapel	guru1	Rahasia123	Guru	guru	Semua	aktif			
Pengawas/Penguji Ruang 1	pengawas1	Rahasia123	Pengawas	pengawas	Ruang 1	aktif			
```

Nilai `role` yang didukung: `siswa`, `guru`, `pengawas`, `proktor`, `admin`. Untuk penguji ujian praktik tetap gunakan role internal `pengawas`.

## 10. Rekap Ruang Dan Presensi

Dashboard petugas memiliki panel `Rekap Ruang & Presensi`.

- Pengawas/penguji dapat melihat rekap ruangnya dan menandai peserta `Hadir` atau `Tidak Hadir`.
- Admin dapat menandai presensi semua ruang.
- Proktor dapat melihat rekap dan mengekspor CSV daftar hadir.
- Tombol `CSV Hadir` membuat file daftar hadir di folder Drive `FOLDER_ID`.
- Tombol `PDF Laporan` membuat arsip PDF pelaksanaan di folder Drive `FOLDER_ID`.

## 11. Ujian Praktik Tanpa Login Siswa

- Buat jadwal dengan jenis asesmen `Ujian Praktik`.
- Jadwal praktik tidak muncul di dashboard siswa dan endpoint pengerjaan CBT akan menolak akses praktik.
- Menu `Ujian Praktik` tersedia untuk admin, proktor, dan pengawas/penguji.
- Pengawas/penguji memilih jadwal praktik, lalu menandai status peserta `Hadir`, `Tidak Hadir`, `Izin`, `Sakit`, atau `Dispensasi`.
- Berita acara praktik tetap disimpan ke `Berita_Acara` dengan `examId` jadwal praktik.
- CSV/PDF untuk jadwal praktik memakai format presensi praktik, bukan status login/timer/tab CBT.

## 12. Role Guru

Role `guru` dapat:

- melihat rekap nilai,
- memuat antrean jawaban esai,
- memberi skor esai,
- mengekspor CSV nilai/jawaban dan PDF laporan.

Role `guru` tidak mendapat tombol buka/tutup ujian, rotasi token, reset siswa langsung, atau pengaturan akun.

## 13. Otomasi Token Dan Backup

Dashboard proktor/admin memiliki utilitas tambahan:

- `Auto Token`: mengaktifkan atau mematikan trigger rotasi token otomatis untuk ujian yang benar-benar sedang terbuka sesuai status dan jadwal.
- `Backup Harian`: mengaktifkan atau mematikan trigger backup spreadsheet harian ke folder Drive `FOLDER_ID`; job akan dilewati jika tidak ada ujian aktif pada tanggal tersebut.

Catatan operasional:

- Trigger berjalan dari Apps Script sebagai pemilik deployment.
- Rotasi token otomatis disarankan hanya saat ujian berlangsung.
- Matikan `Auto Token` setelah sesi selesai agar token tidak berubah di luar jadwal.
- Semua perubahan otomasi dan eksekusi otomatis dicatat ke `Log_Aktivitas`.

## 14. Cache Dan Optimasi

Backend memakai `CacheService` untuk:

- sesi login aktif,
- data sheet yang relatif stabil seperti akun, master data, jadwal, dan bank soal,
- cache bank soal per ujian.

Cache bank soal otomatis dibersihkan saat admin menyimpan atau mengimpor soal.
