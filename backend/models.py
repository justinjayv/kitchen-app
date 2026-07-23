"""
SQLAlchemy ORM models.

Two main tables (pantry_items, recipes) plus a recipe_ingredients table
so each recipe ingredient is its own row. That's what lets us do fast,
simple ingredient-name matching/filtering instead of parsing a big free
text ingredient list every time.
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from database import Base


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False, default=0)
    unit = Column(String, nullable=True, default="")
    purchased_date = Column(String, nullable=True)  # stored as ISO date string
    notes = Column(Text, nullable=True, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    instructions = Column(Text, nullable=True, default="")
    image_url = Column(String, nullable=True, default="")
    recipe_link = Column(String, nullable=True, default="")
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
        order_by="RecipeIngredient.id",
    )


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    name = Column(String, nullable=False, index=True)
    quantity = Column(String, nullable=True, default="")  # free text, e.g. "2 cups"

    recipe = relationship("Recipe", back_populates="ingredients")
