import { useState } from "react";

const EMPTY_INGREDIENT = { name: "", quantity: "" };

export default function RecipeEditor({ initialRecipe, onSave, onCancel }) {
  const [title, setTitle] = useState(initialRecipe?.title || "");
  const [instructions, setInstructions] = useState(initialRecipe?.instructions || "");
  const [imageUrl, setImageUrl] = useState(initialRecipe?.image_url || "");
  const [recipeLink, setRecipeLink] = useState(initialRecipe?.recipe_link || "");
  const [notes, setNotes] = useState(initialRecipe?.notes || "");
  const [ingredients, setIngredients] = useState(
    initialRecipe?.ingredients?.length
      ? initialRecipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity || "" }))
      : [{ ...EMPTY_INGREDIENT }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateIngredient(index, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredientRow(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give the recipe a title first.");
      return;
    }
    const cleanIngredients = ingredients
      .map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() }))
      .filter((i) => i.name);

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        instructions,
        image_url: imageUrl.trim(),
        recipe_link: recipeLink.trim(),
        notes,
        ingredients: cleanIngredients,
      });
    } catch (err) {
      setError("Couldn't save this recipe. Try again.");
      setSaving(false);
    }
  }

  return (
    <form className="editor-panel" onSubmit={handleSubmit}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field-row">
        <label htmlFor="title">Recipe title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      </div>

      <div className="field-row">
        <label>Ingredients</label>
        {ingredients.map((ing, i) => (
          <div className="ingredient-row" key={i}>
            <input
              placeholder="e.g. Eggs"
              value={ing.name}
              onChange={(e) => updateIngredient(i, "name", e.target.value)}
            />
            <input
              placeholder="amount, e.g. 2 cups"
              value={ing.quantity}
              onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
            />
            <button
              type="button"
              className="btn-danger"
              onClick={() => removeIngredientRow(i)}
              aria-label="Remove ingredient"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn-text" onClick={addIngredientRow}>
          + Add ingredient
        </button>
      </div>

      <div className="field-row">
        <label htmlFor="instructions">Instructions</label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Step by step…"
        />
      </div>

      <div className="two-col">
        <div className="field-row">
          <label htmlFor="image">Picture URL</label>
          <input
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="field-row">
          <label htmlFor="link">Recipe link</label>
          <input
            id="link"
            value={recipeLink}
            onChange={(e) => setRecipeLink(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="field-row">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Substitutions, timing tweaks, who liked it…"
        />
      </div>

      <div className="editor-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save recipe"}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
