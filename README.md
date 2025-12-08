# sotukenSample

## Deploy Notes (Render)

- Start command for the backend that serves front & API: `node node/node.js` (Render)
- Environment variables: set `GEMINI_API_KEY` in Render dashboard **(do not store `.env` in the repo)**
- Port: The backend uses `process.env.PORT || 3001` so Render can assign a dynamic port.
- To serve the frontend on the same domain, the backend serves static files from the repo root.

## Security

- Do **not** commit secrets into the repo. If a key is accidentally committed, rotate it immediately and clean repo history.
- Add `.env` to `.gitignore` and store secrets in Render's Environment variables or GitHub Secrets for Actions.

## Quick Local Run

1. Install dependencies:
```
npm install
```
2. Start backend locally and visit the frontend:
```
node node/node.js
```

For frontend-only development, you can serve `index.html` with `npx serve -l 5500`.
