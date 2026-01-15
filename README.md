# Milk Bank Traceability System

Complete digital workflow system for donor human milk with end-to-end traceability, safety enforcement, and two-person verification across 10 workflow stages.

## ✨ Features

- **10-Stage Workflow**: Donor onboarding → intake → batch processing → pasteurisation → microbiology → release → dispatch → NICU admin
- **Hard Stops**: Enforcement at critical gates (donor approval, batch release, contamination quarantine, defrost window)
- **State Machines**: Transitions library for Donor, Donation, Batch, Bottle states with validation
- **Barcode System**: Code128, QR, GS1 payloads for full lineage tracking
- **Two-Person Verification**: Release and NICU admin require dual user approval
- **Immutable Audit Trail**: Every operation logged with before/after snapshots
- **Dispatch & FHIR**: Hospital integration with barcode scanning and manifest export
- **React Dashboard**: Modern UI for all workflows with real-time status tracking

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Backend:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=src uvicorn src.app.main:app --reload
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

Then visit:
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs

## 📚 Documentation

- [Backend Setup](README-IMPLEMENTATION.md) - FastAPI, database, testing
- [Frontend Setup](FRONTEND_SETUP.md) - React, Vite, Tailwind CSS
- [Design Specification](docs/DESIGN.md) - Regulatory, state machines, API design

## 🏗️ Technology Stack

**Backend:**
- FastAPI 0.101.0
- SQLAlchemy 2.0 ORM
- Transitions state machines
- Python-barcode, qrcode
- ReportLab (PDF export)
- Pytest with 13 tests (100% passing)

**Frontend:**
- React 18 + TypeScript
- React Router v6
- Tailwind CSS
- Axios (API client)
- Vite (build tool)
- Lucide Icons

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Dashboard (Port 3000)           │
│         Dashboard | Donors | Batches | Dispatch        │
└────────────────────────┬────────────────────────────────┘
                         │ (Axios HTTP)
┌────────────────────────▼────────────────────────────────┐
│            FastAPI Backend (Port 8000)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 30+ REST Endpoints                              │   │
│  │ • Donors (create, approve)                      │   │
│  │ • Donations (create, accept)                    │   │
│  │ • Batches (assign, pasteurise, test, release)  │   │
│  │ • Samples (create, results → quarantine)        │   │
│  │ • Dispatch (create, scan, receive, FHIR send)   │   │
│  │ • Manifests (JSON/CSV/PDF export)               │   │
│  │ • NICU Admin (allocate, defrost, administer)    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ State Machines + Audit Trail                    │   │
│  │ • Donor: Applied → Screening → Approved → ...  │   │
│  │ • Donation: Collected → Accepted → Assigned... │   │
│  │ • Hard stops at gates (approval, release, etc) │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ (SQLAlchemy ORM)
┌────────────────────────▼────────────────────────────────┐
│           SQLite (Dev) / PostgreSQL (Prod)             │
│  • 14 core tables (Donor, Batch, Bottle, etc)         │
│  • Relationships & constraints enforced               │
│  • Audit log table for traceability                   │
└─────────────────────────────────────────────────────────┘
```

## ✅ Testing

All tests passing (13/13):
```bash
PYTHONPATH=src python -m pytest tests/ -v
```

**Test Coverage:**
- API endpoints (health, CRUD operations)
- State machine transitions
- Constraint enforcement (approval, acceptance, release)
- Barcode generation (Code128, QR, GS1)
- Dispatch workflows (creation, scanning, FHIR send)
- Pasteurisation with micro gating
- Manifest export (JSON, CSV, PDF)

## 🔐 Safety Features

| Gate | Enforcement | Consequence |
|------|------------|-------------|
| Donor Approval | Required before donations | HTTP 400 |
| Donation Acceptance | Required before batch assignment | HTTP 400 |
| Batch Release | Two-person approval required | HTTP 400 |
| Micro Contamination | Positive result → auto-quarantine | Batch locked |
| Defrost Window | 24hr max before NICU admin | HTTP 400 |
| Dispatch | Batch must be Released | HTTP 400 |

## 📋 Workflow Examples

### Donor Onboarding
```
1. POST /api/donors → Create donor (status: Applied)
2. POST /api/donors/{id}/approve → Approve (status: Approved)
3. CREATE DONATION → Now allowed
```

### Batch Release
```
1. POST /api/donations/{id}/accept → Accept donation
2. POST /api/batches → Assign to batch (1+ donations)
3. POST /api/batches/{id}/pasteurise/start → Start
4. POST /api/batches/{id}/pasteurise/complete → Complete
5. POST /api/batches/{id}/samples → Create micro sample
6. POST /api/samples/{id}/results → Post result
   → If positive: batch quarantined (blocks release)
7. POST /api/batches/{id}/release → Two-person approval
   → Status: Released (now can dispatch)
```

### Dispatch to Hospital
```
1. POST /api/hospitals → Create hospital record
2. POST /api/batches/{id}/bottles → Create bottles from batch
3. POST /api/dispatches → Create dispatch (bottle IDs + hospital)
4. POST /api/dispatches/{id}/scan → Scan items out (barcode)
5. GET /api/dispatches/{id}/manifest/pdf → Export manifest
6. POST /api/dispatches/{id}/fhir_send → Send to EHR
7. Hospital receives → POST /api/dispatches/{id}/scan (scan in)
8. POST /api/dispatches/{id}/receive → Confirm receipt
```

### NICU Administration
```
1. GET /api/bottles → Find Available bottle
2. POST /api/bottles/{id}/administer → Allocate to baby
   → Requires: baby_id + admin_user1 + admin_user2 (two-person)
   → Enforces: 24hr defrost window
3. Status → Administered (audit trail logs both admins)
```

## 🐛 Known Issues & TODOs

**Implemented:**
- ✅ Core data models (14 tables)
- ✅ State machines (Donor, Donation)
- ✅ Barcode generation (Code128, QR, GS1)
- ✅ API endpoints (30+)
- ✅ Dispatch & FHIR
- ✅ Manifest export (JSON, CSV, PDF)
- ✅ React dashboard UI
- ✅ Docker setup
- ✅ Tests (13/13 passing)

**Not Yet Implemented:**
- Label printing UI (ZPL templates, printer integration)
- Donor questionnaire upload (file storage)
- Inventory movement tracking (full warehouse UI)
- NICU barcode scanner UI (hardware integration)
- Advanced FHIR mapping (patient/baby linkage)
- Authentication/RBAC (currently assumes admin user)
- Real-time WebSocket updates

## 📄 License

MIT

## 👨‍💻 Development Team

This system was developed with comprehensive research into HMBANA guidelines, HIPAA compliance, HL7/FHIR standards, and operational requirements from milk bank staff.
