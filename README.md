# Larder — Kitchen Inventory & Recipe Matcher

Larder helps you keep track of what's in your kitchen and figure out what
to cook with it. Log what you have, keep your recipes in one place, and
Larder tells you which recipes you can make right now — and exactly what
you'd need to pick up for the rest.

## Features

### Ingredients (pantry)

- Log every ingredient you have with a quantity, unit, storage location
  (Fridge, Freezer, Pantry, or Spices), and any notes.
- Items are grouped by storage location in the table, so you can quickly
  scan just your fridge or just your spice rack.
- Filter the view down to one or more locations with the chip buttons, or
  search by name.
- Edit any field right in the table — click into a cell, change it, and
  it saves automatically.
- Anything at zero quantity is flagged "out" so you know to restock it.

### Recipes

- Add recipes with a title, ingredient list (name + amount), step-by-step
  instructions, a photo (via image URL), a source link, and freeform notes.
- While typing numbered instructions, pressing Enter after a line like
  "1. Preheat the oven" automatically starts the next line at "2." — and
  pressing Enter on an empty numbered line ends the list.
- Every recipe is fully editable and deletable after it's created.

### What can I cook?

- The Recipes page ranks every recipe by what percentage of its
  ingredients you already have on hand, highest first.
- Each recipe card shows that match percentage and lists which
  ingredients are still missing — the first few inline, with a toggle to
  expand and see the rest.
- Opening a recipe's full detail page highlights the missing ingredients
  in your list, so you know exactly what to grab at the store.
- Type an ingredient name (e.g. "egg") into the ingredient filter to see
  only recipes that use it.

### How the matching works

Ingredient names are compared as whole words, not loose substrings — so
"onion, green" in a recipe matches "green onion" in your pantry (word
order doesn't matter), but a pantry item just called "onion" won't be
counted toward a recipe that calls for "green onion". Matching also
ignores capitalization, punctuation, and simple plurals (eggs ↔ egg).

## Running it locally

Larder runs entirely on your own machine — nothing is sent to a server.
You'll need Python 3.10+ and Node.js 18+.

**1. Start the backend** (from `backend/`):

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

This creates a local `kitchen.db` (SQLite) file on first run — that's
where all your data lives.

**2. Start the frontend** (from `frontend/`, in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.
