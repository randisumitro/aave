# AAVE — Autonomous AI Video Editor

<div align="center">

![Created By](https://img.shields.io/badge/Created_By-Randi_Sumitro-0052CC?style=for-the-badge&logo=github&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)
![Status](https://img.shields.io/badge/Phase-1_Foundation-blue?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-Adobe_UXP_%7C_FastAPI_%7C_PostgreSQL-green?style=for-the-badge)

**Sistem Editor Video AI Otonom Berbasis Plugin untuk Adobe Premiere Pro & Adobe After Effects**

**Diciptakan & Diarsiteki Oleh:**  
### **[Randi Sumitro](https://github.com/randisumitro)**

</div>

---

## 📌 Ringkasan Proyek

**AAVE (Autonomous AI Video Editor)** adalah sistem editing video otonom berbasis arsitektur *plugin-first* yang dirancang untuk mengintegrasikan **Adobe Premiere Pro**, **Adobe After Effects**, **Local Companion Service**, dan **AI Backend (FastAPI)**.

Proyek ini memisahkan runtime **Premiere Pro UXP** dan **After Effects UXP** sebagai dua adapter independen yang berkomunikasi melalui **Local Companion Service** (HTTP/WebSocket) serta menerapkan validasi perintah terstruktur melalui **Edit Decision List (EDL)** sebelum operasi dijalankan pada proyek pengguna.

---

## 🏗️ Arsitektur & Status Implementasi

Saat ini repositori berada pada **Phase 1 — Foundation**, dengan komponen berikut yang telah tersedia di dalam kode:

### Komponen yang Sudah Diimplementasikan (Phase 1)

| Komponen | Lokasi | Deskripsi |
|---|---|---|
| **Premiere Pro UXP Plugin** | [`apps/premiere-plugin`](apps/premiere-plugin) | `manifest.json`, `PremiereAdapter`, `CommandRegistry` dengan validasi sebelum eksekusi, `CompanionClient` WebSocket, dan panel UI `AavePanel`. |
| **After Effects UXP Plugin** | [`apps/after-effects-plugin`](apps/after-effects-plugin) | `manifest.json`, `AfterEffectsAdapter`, `CommandRegistry` (termasuk builder kinetic typography, lower thirds, animated captions), `CompanionClient`, dan `AaveMotionPanel`. |
| **Local Companion Service** | [`apps/local-companion`](apps/local-companion) | Layanan FastAPI + WebSocket (`port 8077`) untuk manajemen job, progres WebSocket, pembatalan job, dan simulasi pipeline tahap awal. |
| **Backend API** | [`backend`](backend) | Layanan FastAPI (`port 8000`) dengan endpoint `/health`, `/api/v1/health`, `/api/v1/jobs`, `/api/v1/system/creator`, WebSocket job updates, dan kerangka router `/api/v1/*`. |
| **Skema Database PostgreSQL** | [`database/migrations/001_initial_schema.sql`](database/migrations/001_initial_schema.sql) | Migrasi SQL awal berisi 24 tabel inti (UUID PK, FK, indeks, dan ekstensi `pgvector`). |
| **Shared Packages & SDK** | [`packages`](packages) | Definisi tipe `@aave/shared-types`, skema `@aave/edit-decision-schema`, SDK `@aave/plugin-sdk`, dan kontrak adapter `@aave/adobe-integration`. |
| **Docker & CI/CD** | [`docker-compose.yml`](docker-compose.yml), [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Konfigurasi PostgreSQL, Redis, Backend, Local Companion, serta GitHub Actions CI. |

### Roadmap Fase Berikutnya (Belum Diimplementasikan)

- **Phase 2 — Footage Intelligence:** Ekstraksi metadata (FFmpeg), deteksi scene (PySceneDetect), transkripsi (Whisper), analisis visual (YOLO/CLIP/OpenCV), deteksi hook, dan storyboard.
- **Phase 3 — Autonomous Editing:** Creative Decision Engine, generator EDL otomatis, smart cutting, perakitan timeline, subtitle, dan penempatan audio.
- **Phase 4 — Motion & Sound:** Integrasi rendering After Effects lanjutan, engine motion graphics, sound design, dan sinkronisasi audio.
- **Phase 5 — Quality Control:** Validasi render, perbaikan otomatis, dan pemulihan proyek.
- **Phase 6 — Learning Engine:** Memori preferensi pengguna, feedback learning, dan versioning model.
- **Phase 7 — Production Release:** Audit keamanan penuh, pengemasan plugin, optimasi performa, dan dokumentasi produksi.

> ⚠️ **Catatan Validasi Adobe:**  
> Mesin pengembangan awal tidak memiliki instalasi Adobe Premiere Pro atau After Effects. Seluruh plugin UXP disusun mengikuti pola API Adobe UXP terdokumentasi dan memerlukan pengujian langsung menggunakan **Adobe UXP Developer Tool** pada mesin yang terpasang Premiere Pro & After Effects (lihat [`docs/development/ADOBE_VALIDATION.md`](docs/development/ADOBE_VALIDATION.md)).

---

## 📁 Struktur Direktori

```text
aave/
├── .github/workflows/          # GitHub Actions CI workflow
├── apps/
│   ├── premiere-plugin/        # Plugin UXP untuk Adobe Premiere Pro
│   ├── after-effects-plugin/   # Plugin UXP untuk Adobe After Effects
│   └── local-companion/        # Local Companion Service (FastAPI + WebSocket)
├── backend/                    # Backend API (FastAPI) & unit tests
├── ai-models/                  # Direktori modul model AI (roadmap Phase 2+)
├── packages/
│   ├── shared-types/           # Kontrak tipe bersama TypeScript
│   ├── edit-decision-schema/   # Skema Edit Decision List (EDL)
│   ├── plugin-sdk/             # SDK untuk plugin pihak ketiga
│   └── adobe-integration/      # Abstraksi adapter Adobe
├── database/
│   ├── migrations/             # Migrasi SQL PostgreSQL + pgvector
│   └── seeds/
├── infrastructure/             # Infrastruktur Docker, monitoring, deployment
├── docs/
│   └── development/            # Panduan validasi integrasi Adobe
├── tests/                      # Dokumentasi dan suite pengujian
├── docker-compose.yml
├── LICENSE
├── package.json
└── README.md
```

---

## 🚀 Memulai Pengembangan Lokal

### Prasyarat

- **Node.js** >= 20
- **Python** >= 3.11
- **Docker & Docker Compose** (opsional untuk PostgreSQL, Redis, dan container)
- **Adobe Premiere Pro** & **Adobe After Effects** (untuk pemuatan dan pengujian UXP di host Adobe)

### 1. Instalasi Dependensi Monorepo (Node/TypeScript)

```bash
npm install
```

### 2. Menjalankan Backend API

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -e .
python main.py
```

Backend berjalan di `http://localhost:8000` (cek `GET /health` atau `GET /api/v1/system/creator`).

### 3. Menjalankan Local Companion Service

```bash
cd apps/local-companion
python3 -m venv venv
source venv/bin/activate
pip install -e .
python main.py
```

Local Companion berjalan di `http://localhost:8077` (WebSocket: `ws://localhost:8077/ws/{client_id}`).

### 4. Menjalankan dengan Docker Compose

```bash
docker compose up --build
```

---

## 🧪 Pengujian (Automated Tests)

### Backend API & Local Companion Tests (Pytest)

```bash
cd backend
pytest tests/ -v

cd ../apps/local-companion
pytest tests/ -v
```

### Plugin Tests & Type Check (Vitest + TypeScript)

```bash
npm run typecheck:plugins
npm run test:plugins
```

---

## 👤 Hak Cipta & Atribusi Pembuat

Seluruh kode sumber, arsitektur, dan dokumentasi awal **AAVE (Autonomous AI Video Editor)** dibuat atas nama:

- **Nama:** **Randi Sumitro**
- **GitHub:** [@randisumitro](https://github.com/randisumitro)
- **Tahun:** 2026
- **Lisensi:** [MIT License](LICENSE)
