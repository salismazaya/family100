# Family 100 Web Game

Game kuis Family 100 edisi sekolah. Satu layar untuk papan skor yang dilihat pemain, satu layar remote untuk host yang memandu jalannya ronde.

Papan skor dibuka di HP atau proyektor kelas, remote dibuka di HP host. Keduanya terhubung realtime lewat WebSocket, jadi setiap jawaban dibuka atau strike ditambah langsung tampil di semua layar.

## Cara jalan

Butuh Node.js versi 18 ke atas.

```bash
npm install
npm start
```

Lalu buka di browser satu jaringan:

- Papan pemain: `http://<ip-laptop>:3000/`
- Remote host: `http://<ip-laptop>:3000/remote`

Port default 3000. Untuk ganti port:

```bash
PORT=4000 npm start
```

## Alur main

1. Host buka `/remote`, pilih soal dari daftar.
2. Pemain menjawab bergiliran, host menekan jawaban yang benar untuk membukanya di papan.
3. Jawaban salah menekan tombol TETOT, maksimal 3 strike per ronde.
4. Poin ronde yang terkumpul diberikan ke Tim A atau Tim B.
5. Ulangi untuk soal berikutnya sampai skor akhir ditentukan.

## API

REST:

- `GET /api/state` : status permainan untuk pemain (jawaban yang belum dibuka disembunyikan)
- `GET /api/state/host` : status lengkap untuk host
- `GET /api/questions` : daftar soal
- `POST /api/questions` : tambah soal baru, body `{ question, answers }`
- `DELETE /api/questions/:id` : hapus soal
- `POST /api/action` : aksi permainan (`SET_QUESTION`, `REVEAL_ANSWER`, `HIDE_ANSWER`, `STRIKE`, `RESET_STRIKES`, `RESET_ROUND`, `AWARD_TEAM`, `RESET_GAME`)

WebSocket:

- Client pemain: `ws://<host>:3000/`
- Client host: `ws://<host>:3000/?role=host`
- Server mengirim `INIT` saat konek, lalu `STATE_CHANGED`, `ANSWER_REVEALED`, `STRIKE_TRIGGERED`, dan `QUESTIONS_UPDATED` setiap ada perubahan.

## Bank soal

Soal disimpan lokal di `data/questions.json` dan tidak ikut ke git. File ini dibuat otomatis saat soal pertama ditambah lewat remote.

Format tiap soal:

```json
[
  {
    "id": "q1",
    "question": "Alasan siswa izin keluar saat jam pelajaran berlangsung?",
    "answers": [
      { "answer": "Ke Toilet / Buang Air", "score": 41 },
      { "answer": "Beli Jajan di Kantin", "score": 25 },
      { "answer": "Dipanggil Guru / Ruang BK", "score": 16 },
      { "answer": "Sakit ke UKS", "score": 12 },
      { "answer": "Ambil Barang Ketinggalan", "score": 6 }
    ]
  }
]
```

Untuk mulai dari kosong, cukup buat file `data/questions.json` berisi `[]` lalu tambah soal dari halaman remote.

## Struktur folder

```text
src/
  server.js        # HTTP + WebSocket, titik masuk aplikasi
  app.js           # route Express dan API
  game/state.js    # skor, strike, dan status ronde
  store/questions.js # baca dan simpan bank soal lokal
public/
  index.html       # papan skor pemain
  remote.html      # remote host
  js/board.js      # logika papan skor
  js/remote.js     # logika remote host
  js/sound.js      # efek suara
  css/             # gaya papan dan remote
tests/             # jest dan supertest
data/questions.json # bank soal lokal (diabaikan git)
```

## Tes

```bash
npm test
```
