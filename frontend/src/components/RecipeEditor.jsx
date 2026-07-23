import { useState, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import ImageAdjustModal from "./ImageAdjustModal";

const NUMBERED_LINE = /^(\s*)(\d+)([.)])[ \t](.*)$/;

const EMPTY_INGREDIENT = { name: "", quantity: "" };

function buildInitialState(recipe) {
  return {
    title: recipe?.title || "",
    instructions: recipe?.instructions || "",
    imageUrl: recipe?.image_url || "",
    imagePosition: recipe?.image_position || "50% 50%",
    imageScale: recipe?.image_scale || 1,
    recipeLink: recipe?.recipe_link || "",
    notes: recipe?.notes || "",
    ingredients: recipe?.ingredients?.length
      ? recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity || "" }))
      : [{ ...EMPTY_INGREDIENT }],
  };
}

const RecipeEditor = forwardRef(function RecipeEditor(
  { initialRecipe, onSave, onCancel, onDirtyChange },
  ref
) {
  const [initialState] = useState(() => buildInitialState(initialRecipe));
  const [title, setTitle] = useState(initialState.title);
  const [instructions, setInstructions] = useState(initialState.instructions);
  const [imageUrl, setImageUrl] = useState(initialState.imageUrl);
  const [imagePosition, setImagePosition] = useState(initialState.imagePosition);
  const [imageScale, setImageScale] = useState(initialState.imageScale);
  const [recipeLink, setRecipeLink] = useState(initialState.recipeLink);
  const [notes, setNotes] = useState(initialState.notes);
  const [ingredients, setIngredients] = useState(initialState.ingredients);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const instructionsRef = useRef(null);
  const formRef = useRef(null);

  const isDirty = useMemo(() => {
    const current = { title, instructions, imageUrl, imagePosition, imageScale, recipeLink, notes, ingredients };
    return JSON.stringify(current) !== JSON.stringify(initialState);
  }, [title, instructions, imageUrl, imagePosition, imageScale, recipeLink, notes, ingredients, initialState]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    submit: () => formRef.current?.requestSubmit(),
  }));

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
        image_position: imagePosition,
        image_scale: imageScale,
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
    <form className="editor-panel" ref={formRef} onSubmit={handleSubmit}>
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
        <label>Photo crop</label>
        <div className="image-thumb-row">
          <div className="image-thumb-frame">
            {imageUrl ? (
              <div
                className="image-thumb-photo"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: imagePosition,
                  transform: `scale(${imageScale})`,
                  transformOrigin: imagePosition,
                }}
              />
            ) : (
              <span>No photo</span>
            )}
          </div>
          <button
            type="button"
            className="btn"
            disabled={!imageUrl}
            onClick={() => setShowAdjustModal(true)}
          >
            Adjust photo
          </button>
        </div>
      </div>

      {showAdjustModal && (
        <ImageAdjustModal
          imageUrl={imageUrl}
          initialPosition={imagePosition}
          initialScale={imageScale}
          onCancel={() => setShowAdjustModal(false)}
          onSave={(position, scale) => {
            setImagePosition(position);
            setImageScale(scale);
            setShowAdjustModal(false);
          }}
        />
      )}

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
});

export default RecipeEditor;
