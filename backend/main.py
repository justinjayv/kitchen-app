"""
Kitchen Inventory + Recipe app -- FastAPI backend.

Run with:
    uvicorn main:app --reload --port 8000

Interactive API docs are then available at http://localhost:8000/docs
"""

from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db
from matching import build_pantry_name_set, match_recipe_against_pantry, normalize

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kitchen Inventory API")

# Allow the React dev server (Vite defaults to :5173) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================================
# Pantry endpoints
# =========================================================================

@app.get("/pantry", response_model=List[schemas.PantryItemOut])
def list_pantry_items(
    search: Optional[str] = Query(None, description="Filter by name, case-insensitive substring"),
    db: Session = Depends(get_db),
):
    query = db.query(models.PantryItem)
    if search:
        query = query.filter(models.PantryItem.name.ilike(f"%{search}%"))
    return query.order_by(models.PantryItem.name).all()


@app.post("/pantry", response_model=schemas.PantryItemOut, status_code=201)
def create_pantry_item(item: schemas.PantryItemCreate, db: Session = Depends(get_db)):
    db_item = models.PantryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.put("/pantry/{item_id}", response_model=schemas.PantryItemOut)
def update_pantry_item(item_id: int, item: schemas.PantryItemUpdate, db: Session = Depends(get_db)):
    db_item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    for field, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


@app.delete("/pantry/{item_id}", status_code=204)
def delete_pantry_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    db.delete(db_item)
    db.commit()
    return None


# =========================================================================
# Recipe endpoints
# =========================================================================

def _apply_ingredients(db_recipe: models.Recipe, ingredients: List[schemas.RecipeIngredientBase], db: Session):
    """Replace a recipe's ingredient rows with a new set."""
    db_recipe.ingredients = [
        models.RecipeIngredient(name=ing.name, quantity=ing.quantity or "")
        for ing in ingredients
    ]


@app.get("/recipes", response_model=List[schemas.RecipeOut])
def list_recipes(
    search: Optional[str] = Query(None, description="Filter by title, case-insensitive substring"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Recipe)
    if search:
        query = query.filter(models.Recipe.title.ilike(f"%{search}%"))
    return query.order_by(models.Recipe.title).all()


@app.get("/recipes/ranked", response_model=List[schemas.RecipeRanked])
def list_recipes_ranked(db: Session = Depends(get_db)):
    """
    All recipes, sorted by what % of their ingredients are already in the
    pantry (highest first). Each recipe also lists which ingredients
    matched and which are missing, so the frontend can highlight gaps.
    """
    pantry_names = build_pantry_name_set(db.query(models.PantryItem).all())
    recipes = db.query(models.Recipe).all()

    ranked = []
    for recipe in recipes:
        pct, matched, missing = match_recipe_against_pantry(recipe.ingredients, pantry_names)
        ranked.append(
            schemas.RecipeRanked(
                **schemas.RecipeOut.model_validate(recipe).model_dump(),
                match_percentage=pct,
                matched_ingredients=matched,
                missing_ingredients=missing,
            )
        )

    ranked.sort(key=lambda r: r.match_percentage, reverse=True)
    return ranked


@app.get("/recipes/filter", response_model=List[schemas.RecipeOut])
def filter_recipes_by_ingredient(
    ingredient: str = Query(..., description="e.g. 'egg' returns all recipes containing egg"),
    db: Session = Depends(get_db),
):
    norm_target = normalize(ingredient)
    if not norm_target:
        return []

    recipes = db.query(models.Recipe).all()
    results = []
    for recipe in recipes:
        for ing in recipe.ingredients:
            norm_ing = normalize(ing.name)
            if norm_target in norm_ing or norm_ing in norm_target:
                results.append(recipe)
                break
    return results


@app.get("/recipes/{recipe_id}", response_model=schemas.RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return db_recipe


@app.post("/recipes", response_model=schemas.RecipeOut, status_code=201)
def create_recipe(recipe: schemas.RecipeCreate, db: Session = Depends(get_db)):
    data = recipe.model_dump(exclude={"ingredients"})
    db_recipe = models.Recipe(**data)
    db.add(db_recipe)
    db.flush()  # assigns db_recipe.id without committing yet
    _apply_ingredients(db_recipe, recipe.ingredients, db)
    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@app.put("/recipes/{recipe_id}", response_model=schemas.RecipeOut)
def update_recipe(recipe_id: int, recipe: schemas.RecipeUpdate, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    update_data = recipe.model_dump(exclude_unset=True, exclude={"ingredients"})
    for field, value in update_data.items():
        setattr(db_recipe, field, value)

    if recipe.ingredients is not None:
        _apply_ingredients(db_recipe, recipe.ingredients, db)

    db.commit()
    db.refresh(db_recipe)
    return db_recipe


@app.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: int, db: Session = Depends(get_db)):
    db_recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not db_recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(db_recipe)
    db.commit()
    return None


@app.get("/")
def root():
    return {"status": "ok", "service": "kitchen-inventory-api"}
