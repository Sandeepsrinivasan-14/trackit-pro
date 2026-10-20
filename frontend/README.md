# TrackIt Pro — frontend

React 19 + Vite. Kanban boards, dashboards and team management.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm test` | Vitest (jsdom) |
| `npm run build` | Production build into `build/` |
| `npm run preview` | Serve the production build locally |

## Environment variables

Vite only exposes variables prefixed with `VITE_` (these replace the old `REACT_APP_*`):

- `VITE_API_URL` — backend URL (default `http://localhost:5000`)
- `VITE_DEMO_MODE=true` — show the demo-accounts panel on the login page (off by default)
