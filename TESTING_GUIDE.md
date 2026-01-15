# Milk Bank System - Complete Setup & Testing Guide

## ✅ Current Status

- **Backend API**: ✅ Ready (13/13 tests passing, 30+ endpoints)
- **React Frontend**: ✅ Ready (npm build successful, all TypeScript types passing)
- **Docker Compose**: ✅ Ready (for easy local testing and deployment)

---

## 🚀 Option 1: Quick Start with Docker Compose (Easiest)

```bash
cd /Users/hammadkhan/.vscode/extensions/github.copilot-chat-0.33.4/assets/Milk\ Bank\ Software/project

# Build and start both backend and frontend
docker-compose up

# In browser:
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

**First time?** Docker will build images (~3-5 min), then start services (~1 min).

---

## 🖥️ Option 2: Local Development (Best for Testing)

### Terminal 1: Backend API

```bash
cd /Users/hammadkhan/.vscode/extensions/github.copilot-chat-0.33.4/assets/Milk\ Bank\ Software

# Activate venv (one time)
python3 -m venv .venv
source .venv/bin/activate

# Install deps (first time only)
pip install -r project/requirements.txt

# Start API
cd project
PYTHONPATH=src uvicorn src.app.main:app --reload
```

API running at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### Terminal 2: Frontend Dev Server

```bash
cd /Users/hammadkhan/.vscode/extensions/github.copilot-chat-0.33.4/assets/Milk\ Bank\ Software/project/frontend

# Install deps (first time only)
npm install

# Start dev server
npm run dev
```

Frontend running at: **http://localhost:3000**

### Terminal 3: Run Tests (Optional)

```bash
cd /Users/hammadkhan/.vscode/extensions/github.copilot-chat-0.33.4/assets/Milk\ Bank\ Software
source .venv/bin/activate
cd project
PYTHONPATH=src python -m pytest tests/ -v
```

Expected: **13 passed** ✅

---

## 📋 What to Test

### 1. Dashboard (http://localhost:3000)
- [ ] Page loads with stats (donors, batches, etc.)
- [ ] Navigation sidebar works
- [ ] Quick action buttons visible

### 2. Donor Management
- [ ] Create new donor → See it in list
- [ ] Approve donor → Status changes
- [ ] Verify hard-stop: Cannot create donation for unapproved donor

### 3. Batch Processing
- [ ] Create batch from donations
- [ ] View batch detail page
- [ ] See pasteurisation controls

### 4. Dispatch & Manifest
- [ ] Create dispatch
- [ ] Scan items (barcode input)
- [ ] Export PDF manifest
- [ ] View dispatch tracking

### 5. API Integration (Swagger at http://localhost:8000/docs)
- [ ] Try creating a donor via Swagger
- [ ] Try approving donor
- [ ] Create donation, batch, etc.
- [ ] All responses return JSON with proper status codes

---

## 🔧 Troubleshooting

### Frontend won't start
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API returning 400 errors
- Check that donors are approved before creating donations
- Check that donations are accepted before assigning to batches
- See [README-IMPLEMENTATION.md](README-IMPLEMENTATION.md) for workflow order

### Port already in use
```bash
# Kill process using port
lsof -i :8000  # Find backend process
lsof -i :3000  # Find frontend process
kill -9 <PID>
```

### Tests failing
```bash
# Ensure venv is activated
source .venv/bin/activate
cd project
PYTHONPATH=src python -m pytest tests/ -v --tb=short
```

---

## 📊 System Architecture

```
┌──────────────────────────────────────────────┐
│  React Dashboard (localhost:3000)            │
│  • Dashboard, Donors, Batches, Dispatch     │
└─────────────────────┬──────────────────────┘
                      │ Axios HTTP
┌─────────────────────▼──────────────────────┐
│  FastAPI Backend (localhost:8000)          │
│  • 30+ REST endpoints                      │
│  • State machines & constraints            │
│  • FHIR integration                        │
└─────────────────────┬──────────────────────┘
                      │ SQLAlchemy ORM
┌─────────────────────▼──────────────────────┐
│  SQLite Database (dev) / Postgres (prod)   │
│  • 14 tables with relationships            │
│  • Audit log for immutable trail           │
└──────────────────────────────────────────┘
```

---

## 🎯 Key Workflows to Test

### Donor Onboarding
1. **POST** `/api/donors` → Create donor
   ```json
   {"donor_code": "MX-001"}
   ```
2. **POST** `/api/donors/{id}/approve` → Approve
   ```json
   {"approver_id": "admin"}
   ```
3. Now donations can be created for this donor

### Batch Release (Two-Person Approval)
1. Create donation + batch
2. Start/complete pasteurisation
3. Create micro sample, post result
4. **POST** `/api/batches/{id}/release`
   ```json
   {"approver_id": "user1", "approver2_id": "user2"}
   ```

### Dispatch to Hospital
1. Create batch (must be Released)
2. Create bottles from batch
3. **POST** `/api/dispatches` → Create dispatch
4. **POST** `/api/dispatches/{id}/scan` → Scan items
5. **GET** `/api/dispatches/{id}/manifest/pdf` → Export manifest

---

## 📦 Files & Structure

```
project/
├── src/
│   └── app/
│       ├── main.py           # FastAPI app
│       ├── models.py         # SQLAlchemy ORM
│       ├── crud.py           # Business logic (25+ functions)
│       ├── api.py            # 30+ endpoints
│       ├── barcode.py        # Code128, QR generation
│       ├── state_machines.py # Transitions library
│       └── database.py       # DB setup
├── tests/
│   ├── conftest.py           # Pytest fixtures
│   └── test_*.py             # 13 test files
├── frontend/
│   ├── src/
│   │   ├── api.ts            # Axios client
│   │   ├── pages/            # 7 page components
│   │   └── components/       # Layout sidebar
│   ├── package.json
│   └── vite.config.ts
├── requirements.txt          # Python deps
├── docker-compose.yml        # Docker setup
└── Dockerfile               # Backend image

```

---

## ✨ Features Ready to Use

### 10-Stage Workflow
✅ Donor onboarding  
✅ Container/donation intake  
✅ Batch processing  
✅ Pasteurisation  
✅ Microbiology (with auto-quarantine)  
✅ Release (two-person approval)  
✅ Dispatch creation & tracking  
✅ Hospital FHIR integration  
✅ NICU administration (defrost timer)  
✅ Immutable audit trail  

### Safety Features
✅ Hard stops at critical gates  
✅ State machine validation  
✅ Two-person verification  
✅ Barcode lineage tracking  
✅ Contamination quarantine  

### Export & Integration
✅ Manifest export (JSON/CSV/PDF)  
✅ FHIR Bundle messaging  
✅ API documentation (Swagger)  

---

## 🚢 Next Steps After Testing

1. **Authentication**: Add JWT login (currently assumes admin)
2. **Real-time Updates**: WebSocket for live status
3. **Barcode Scanner**: Hardware device integration
4. **Audit Log Viewer**: Browse immutable audit trail
5. **Deployment**: Production docker-compose with Postgres, secrets, TLS

---

## 📞 Support

- **API Issues?** Check `/api/docs` (Swagger UI)
- **Frontend Issues?** Check browser console (F12) and terminal output
- **Database Issues?** Check `milkbank.db` exists in project root
- **Tests?** Run `PYTHONPATH=src python -m pytest tests/ -v --tb=short`

---

## 📝 Example cURL Commands

```bash
# Create donor
curl -X POST "http://localhost:8000/api/donors" \
  -H "Content-Type: application/json" \
  -d '{"donor_code":"MX-001"}'

# Approve donor
curl -X POST "http://localhost:8000/api/donors/{donor_id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"approver_id":"admin"}'

# List all donors
curl "http://localhost:8000/api/donors"

# Get API health
curl "http://localhost:8000/api/health"
```

---

## ✅ Ready for Production?

**Almost!** Still needed:
- [ ] Authentication (JWT/OAuth)
- [ ] Environment config (.env with secrets)
- [ ] CORS setup (if deploying separately)
- [ ] HTTPS/TLS certificates
- [ ] Database migrations (Alembic)
- [ ] Security audit
- [ ] Load testing

See [Task 7 & 8 TODO items](README.md) for deployment checklist.

**But the core system is fully functional and tested!** 🎉
