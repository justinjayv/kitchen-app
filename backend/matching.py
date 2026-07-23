"""
Ingredient name matching logic.

Kept intentionally simple and dependency-free: lowercase, strip
punctuation/whitespace, and drop a trailing 's' as a crude singular/plural
normalizer (eggs -> egg, tomatoes -> tomatoe... good enough for matching
since we compare both sides the same way). A pantry ingredient "matches" a
recipe ingredient if one normalized name contains the other -- this lets
"egg" in the pantry match "large eggs" in a recipe, and vice versa.
"""

import re
from typing import Iterable, List, Set, Tuple

from models import PantryItem, RecipeIngredient


def normalize(name: str) -> str:
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    if name.endswith("s") and len(name) > 3:
        name = name[:-1]
    return name


def _names_match(a: str, b: str) -> bool:
    if not a or not b:
        return False
    return a == b or a in b or b in a


def build_pantry_name_set(pantry_items: Iterable[PantryItem]) -> Set[str]:
    return {normalize(item.name) for item in pantry_items if item.name}


def match_recipe_against_pantry(
    recipe_ingredients: Iterable[RecipeIngredient],
    pantry_names: Set[str],
) -> Tuple[float, List[str], List[str]]:
    """
    Returns (match_percentage, matched_ingredient_names, missing_ingredient_names)
    using the *original* (non-normalized) ingredient names for display.
    """
    ingredients = list(recipe_ingredients)
    if not ingredients:
        return 0.0, [], []

    matched: List[str] = []
    missing: List[str] = []

    for ing in ingredients:
        norm = normalize(ing.name)
        if any(_names_match(norm, pantry_name) for pantry_name in pantry_names):
            matched.append(ing.name)
        else:
            missing.append(ing.name)

    percentage = round(100 * len(matched) / len(ingredients), 1)
    return percentage, matched, missing
