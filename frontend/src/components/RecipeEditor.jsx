import { useState, useRef } from "react";

const NUMBERED_LINE = /^(\s*)(\d+)([.)])[ \t](.*)$/;

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
  const instructionsRef = useRef(null);

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

  function handleInstructionsKeyDown(e) {
    if (e.key !== "Enter") return;

    const textarea = e.target;
    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart !== selectionEnd) return;

    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const currentLine = value.slice(lineStart, selectionStart);
    const match = currentLine.match(NUMBERED_LINE);
    if (!match) return;

    e.preventDefault();
    const [, indent, num, delim, rest] = match;

    if (rest.trim() === "") {
      // Enter on an empty numbered line ends the list instead of continuing it.
      const newValue = value.slice(0, lineStart) + value.slice(selectionStart);
      setInstructions(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = lineStart;
      });
      return;
    }

    const insertion = `\n${indent}${Number(num) + 1}${delim} `;
    const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
    const newCursor = selectionStart + insertion.length;
    setInstructions(newValue);
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursor;
    });
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
          ref={instructionsRef}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          onKeyDown={handleInstructionsKeyDown}
          placeholder="Step by step… (start a line with '1.' to begin a numbered list)"
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
