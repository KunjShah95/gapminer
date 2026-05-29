# Gapminer TODO

## Completed: TS Config Warnings
- [x] tsconfig.json updates
- [x] Restart TS server & builds

## Fix: Registration failed (API not starting)
1. [x] Diagnosed import path bug in endpoints/aiModels.js
2. [x] Edit aiModels.js imports (../../ → ../../../)
3. [x] `cd /d apps/api & npm run dev` (Windows cmd, confirm :8000)
4. [x] Test registration http://localhost:3000/auth?mode=signup
5. [x] Verify DB insert `psql -d gapminer -c "SELECT * FROM users ORDER BY created_at DESC LIMIT 1"`
6. [x] Fix test-auth.js for native fetch
7. [x] Mark complete
