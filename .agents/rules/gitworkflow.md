# NextWhere GitHub & Team Workflow (Team of 4)

## 1. Branch Hierarchy & Environments

```text
main                               ──► 🔒 Production & Live Client Demo (Protected, Maintainer-only)
 └── staging                       ──► 🧪 Pre-Release Deployment & Invariants Testing (make validate)
      └── develop                  ──► 🛠️ Active Integration Trunk (Hub for domain merges)
           ├── domain/ui           ──► 🎨 Full Stack / UI Team (Next.js, Tailwind, deck.gl/MapLibre)
           ├── domain/ml           ──► 🧠 ML / Analytics Team (Huff Demand, LightGBM, SHAP XAI)
           └── domain/backend      ──► ⚡ Backend / Data Team (FastAPI, DuckDB, H3 Grid)
```

---

## 2. Directory Isolation Policy (Zero Merge Conflicts)

To prevent merge conflicts across the 4 teammates, each discipline has dedicated directory ownership:

- **Full Stack / UI**: Works in `frontend/` (Next.js components, pages, styles, public assets).
- **ML / Analytics**: Works in `ml/` (models, engines, feature engineering, SHAP explainers).
- **Backend / Data**: Works in `backend/` and `data/` (FastAPI routes, data manifests, caching).
- **Shared Contracts**: `shared/contracts/` defines the API schemas (`types.ts`, `api_schema.json`). Any changes require review from both UI and Backend leads.
- **QA / Tests**: `tests/` contains invariant suite (I1-I12) and end-to-end integration tests.

---

## 3. Developer Commands & Workflows

### 🎨 Full Stack / UI Developer:
```bash
git switch domain/ui
git pull origin domain/ui
git switch -c feat/ui-map-dashboard
# ... work inside frontend/ ...
git add frontend/
git commit -m "feat(ui): add h3 hexagonal layer and site brief drawer"
git push origin feat/ui-map-dashboard
# Open PR to merge feat/ui-map-dashboard -> domain/ui
```

### 🧠 ML / Analytics Developer:
```bash
git switch domain/ml
git pull origin domain/ml
git switch -c feat/ml-huff-model
# ... work inside ml/ ...
git add ml/
git commit -m "feat(ml): implement huff gravity model and cannibalization penalty"
git push origin feat/ml-huff-model
# Open PR to merge feat/ml-huff-model -> domain/ml
```

### ⚡ Backend / Data Developer:
```bash
git switch domain/backend
git pull origin domain/backend
git switch -c feat/be-candidates-api
# ... work inside backend/ and data/ ...
git add backend/
git commit -m "feat(api): expose /v1/candidates and /v1/sites/brief endpoints"
git push origin feat/be-candidates-api
# Open PR to merge feat/be-candidates-api -> domain/backend
```

### 🛡️ Lead / Maintainer (Promotions):
- Regularly rebases `domain/*` onto `develop` to keep them synchronized.
- Merges tested domain features into `develop`.
- Promotes `develop` into `staging` for full validation (`pytest tests/`).
- Promotes `staging` to `main` for production releases with semantic release tags (e.g., `v1.0.0-p0`).

---

## 4. Golden Git Rules
1. **Never commit directly on `main` or `staging`**.
2. **Always rebase feature branches before merging** to maintain a clean linear git history.
3. **Always ask for explicit user confirmation before pushing any branch to `origin`**.
