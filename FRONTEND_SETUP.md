# React Dashboard - Quick Start

This directory contains the React frontend for the Milk Bank Workflow System.

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)
```bash
cd ..  # Go to project root
docker-compose up
```

Then visit:
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### Option 2: Local Development

#### Backend
```bash
cd ..  # Go to project root
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
PYTHONPATH=src uvicorn src.app.main:app --reload
```

#### Frontend (in new terminal)
```bash
cd frontend
npm install
npm run dev
```

Then visit http://localhost:3000

## 📁 Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   └── Layout.tsx           # Navigation sidebar
│   ├── pages/
│   │   ├── Dashboard.tsx        # Home/overview
│   │   ├── Donors.tsx           # Donor list
│   │   ├── NewDonor.tsx         # Donor registration
│   │   ├── Batches.tsx          # Batch list
│   │   ├── BatchDetail.tsx      # Batch operations
│   │   ├── Bottles.tsx          # Bottle inventory
│   │   ├── Dispatch.tsx         # Dispatch list
│   │   └── DispatchDetail.tsx   # Dispatch tracking & scanning
│   ├── styles/
│   │   └── index.css            # Global styles (Tailwind)
│   ├── api.ts                   # API client (Axios)
│   ├── App.tsx                  # Router
│   └── main.tsx                 # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite config (proxy to backend)
├── tailwind.config.ts           # Tailwind theming
└── README.md
```

## 🎨 Features

### Dashboard
- Overview of donors, batches, pending approvals, dispatches
- Quick action buttons for common workflows
- Real-time stats

### Donor Management
- Register new donors with donor codes
- View all donors with status
- Approve/screen donors (with workflow enforcement)

### Batch Processing
- Create batches from donations
- Track pasteurisation start/complete
- View microbiology test status
- Release batch with two-person approval

### Bottle Management
- View all bottles with status
- See allocation to babies
- Track defrost status

### Dispatch & FHIR
- Create dispatches to hospitals
- Barcode scanning for in/out tracking
- View manifest
- Export manifest as JSON/CSV/PDF
- Send to hospital via FHIR

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```
VITE_API_URL=http://localhost:8000/api
```

### Backend Proxy
Edit `vite.config.ts` to change the API target:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',  // Change this
      changeOrigin: true,
    },
  },
},
```

## 📦 Dependencies

- **React 18**: UI framework
- **React Router 6**: Navigation
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **Lucide Icons**: Icon library
- **Vite**: Build tool
- **TypeScript**: Type safety

## 🧪 Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
npm run preview
```

## 🚢 Deployment

### Production Build
```bash
npm run build
# Creates optimized build in dist/
```

### Serve on Production
```bash
npm run preview
# Or use a static host: netlify, vercel, github pages, S3, etc.
```

### Docker
```bash
docker build -f frontend/Dockerfile -t milkbank-frontend .
docker run -p 3000:3000 milkbank-frontend
```

## 🔐 Security Notes

- The dashboard assumes authentication is handled at the API level
- API calls include user_id for audit logging
- All sensitive data (batch codes, barcodes) should be HTTPS only in production
- Consider adding JWT/OAuth authentication
- Implement RBAC at the API layer (role-based access control)

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or change port in vite.config.ts
```

### API calls failing
- Check backend is running: `http://localhost:8000/docs`
- Verify proxy in `vite.config.ts`
- Check CORS headers in FastAPI (`python-cors` middleware)

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 Next Steps

1. **Authentication**: Add JWT/OAuth login
2. **Real-time**: WebSocket for live updates
3. **Advanced Filtering**: Search, sort, date ranges
4. **Barcode Scanner**: Hardware barcode integration
5. **Audit Log Viewer**: Display audit trail
6. **User Profiles**: Settings, preferences, role management
7. **Mobile**: React Native or PWA

## 📖 API Reference

See [../README-IMPLEMENTATION.md](../README-IMPLEMENTATION.md) for backend API documentation.

## 📝 License

Same as main project.
