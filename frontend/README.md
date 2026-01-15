# Milk Bank Dashboard

React + TypeScript + Tailwind CSS frontend for Milk Bank Workflow System.

## Quick Start

### Install Dependencies
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
```

The app will run on `http://localhost:3000` and proxy API calls to `http://localhost:8000/api`.

### Build for Production
```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── api.ts              # Axios client and API calls
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # React DOM render
│   ├── components/
│   │   └── Layout.tsx      # Navigation sidebar + layout
│   ├── pages/
│   │   ├── Dashboard.tsx   # Overview & quick stats
│   │   ├── Donors.tsx      # Donor list & search
│   │   ├── NewDonor.tsx    # Donor registration form
│   │   ├── Batches.tsx     # Batch management
│   │   └── Dispatch.tsx    # Dispatch tracking & export
│   └── styles/
│       └── index.css       # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## Features

- **Dashboard**: Overview of donors, batches, pending approvals, dispatched items
- **Donor Management**: Register new donors, approve/screen donors
- **Batch Processing**: Create batches, track pasteurisation, microbiology results
- **Dispatch & FHIR**: Create dispatches, scan items, send to hospitals via FHIR
- **Manifest Export**: Download dispatch manifests as JSON, CSV, or PDF
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Status Tracking**: Live updates on batch/dispatch status

## Environment Variables

The app proxies API requests to the FastAPI backend. Update `vite.config.ts` to change the backend URL.

## Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Architecture

The frontend communicates with the FastAPI backend via REST API:
- **API Client**: `src/api.ts` uses Axios for HTTP requests
- **Components**: React functional components with hooks
- **State**: Local state with `useState`, API data with `useEffect`
- **Routing**: React Router v6 for navigation
- **Styling**: Tailwind CSS for utility-based design

## Next Steps

- Add authentication (JWT/OAuth)
- Implement barcode scanner integration
- Add real-time updates (WebSocket)
- Build advanced filtering & search
- Add user profile & settings pages
- Implement audit log viewer
