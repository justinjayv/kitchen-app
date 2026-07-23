# Larder — Kitchen Inventory & Recipe Matcher

A small full-stack app: track what's in your pantry, keep your recipes in
one place, and see which recipes you can cook right now based on what you
already have.

- **Backend:** Python (FastAPI + SQLAlchemy + SQLite)
- **Frontend:** React (Vite)

## What it does today

1. **Pantry** — add/edit/delete items with quantity, unit, purchase date,
   and notes, in an inline-editable table built to stay fast with hundreds
   of rows.
2. **Recipes** — create recipes with a title, ingredient list, instructions,
   a picture (via URL), a source link, and notes. Fully editable.
3. **Ranking** — the Recipes page ranks every recipe by what percentage of
   its ingredients are already in your pantry, and highlights exactly
   which ingredients are missing (in red) on both the recipe card and the
   recipe detail page.
4. **Ingredient filter** — type an ingredient (e.g. "egg") to see only
   recipes that use it.

## Project structure

```
kitchen-app/
  backend/          FastAPI app
    main.py         API routes
    models.py       SQLAlchemy tables (pantry_items, recipes, recipe_ingredients)
    schemas.py      Pydantic request/response shapes
    matching.py     Ingredient name normalization + match % logic
    database.py     SQLite engine/session setup
  frontend/         React (Vite) app
    src/
      api.js                    fetch wrapper for the backend
      App.jsx                   layout + nav
      components/
        PantryView.jsx          inline-editable pantry table
        RecipesView.jsx         recipe grid, search, ingredient filter
        RecipeCard.jsx          card with match gauge + missing chips
        RecipeEditor.jsx        create/edit form
        RecipeDetail.jsx        full recipe view with missing ingredients highlighted
        MatchGauge.jsx          the small "measuring cup" match % gauge
```

## Running it locally

You'll need Python 3.10+ and Node.js 18+.

**1. Start the backend** (from `backend/`):

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

This creates `kitchen.db` (SQLite) automatically on first run. API docs
are live at http://localhost:8000/docs.

**2. Start the frontend** (from `frontend/`, in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — it's already configured (via `.env`) to talk
to the backend at `http://localhost:8000`.

## How the ranking works

Ingredient names are normalized (lowercased, punctuation stripped, trailing
"s" dropped) and compared as substrings in both directions, so "egg" in
your pantry matches "3 large eggs" in a recipe. A recipe's match % is
`matched ingredients / total ingredients`. This is intentionally simple —
easy to extend later (e.g. unit-aware quantity checks, so "1 egg" needed
but you only have partial quantity would show differently).

## Ideas for next steps

- Quantity-aware matching (not just "do I have it" but "do I have *enough*")
- Auto-decrement pantry quantities when you cook a recipe
- Expiration-date warnings on pantry items
- Image upload instead of URL-only
- Recipe tags/categories and multi-ingredient filtering
- User accounts (currently single-user, local SQLite)

Since you said you'd build on this — this structure (separate schemas,
matching logic in its own module, component-per-concern on the frontend)
should make most of the above additive rather than requiring rewrites.
