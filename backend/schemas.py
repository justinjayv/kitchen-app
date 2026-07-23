"""
Pydantic schemas: what the API accepts and returns.
"""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


# ---------- Pantry ----------

class PantryItemBase(BaseModel):
    name: str
    quantity: float = 0
    unit: Optional[str] = ""
    purchased_date: Optional[str] = None
    notes: Optional[str] = ""


class PantryItemCreate(PantryItemBase):
    pass


class PantryItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    purchased_date: Optional[str] = None
    notes: Optional[str] = None


class PantryItemOut(PantryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    updated_at: datetime


# ---------- Recipe ingredients ----------

class RecipeIngredientBase(BaseModel):
    name: str
    quantity: Optional[str] = ""


class RecipeIngredientOut(RecipeIngredientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Recipes ----------

class RecipeBase(BaseModel):
    title: str
    instructions: Optional[str] = ""
    image_url: Optional[str] = ""
    recipe_link: Optional[str] = ""
    notes: Optional[str] = ""


class RecipeCreate(RecipeBase):
    ingredients: List[RecipeIngredientBase] = []


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    instructions: Optional[str] = None
    image_url: Optional[str] = None
    recipe_link: Optional[str] = None
    notes: Optional[str] = None
    ingredients: Optional[List[RecipeIngredientBase]] = None


class RecipeOut(RecipeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    ingredients: List[RecipeIngredientOut] = []


class RecipeRanked(RecipeOut):
    match_percentage: float
    matched_ingredients: List[str]
    missing_ingredients: List[str]
