import { useState, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from "react";
import ImageAdjustModal from "./ImageAdjustModal";

const NUMBERED_LINE = /^(\s*)(\d+)([.)])[ \t](.*)$/;

const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype,
  "value"
).set;

// Scans the whole text for contiguous numbered-list runs (same indent, no
// break in between) and renumbers each one sequentially, keeping the run's
// first line as the anchor. Running this after every edit — rather than
// trying to catch the specific keystroke that removed or added an item —
// means it doesn't matter *how* an item was removed (select-and-delete,
// backspacing through it, cut, etc.): whatever remains just gets relabeled.
function renumberInstructionsText(value) {
  const lines = value.split("\n");
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(NUMBERED_LINE);
    if (!m) {
      i++;
      continue;
    }
    const indent = m[1];
    let expected = Number(m[2]) + 1;
    let j = i + 1;
    while (j < lines.length) {
      const m2 = lines[j].match(NUMBERED_LINE);
      if (!m2 || m2[1] !== indent) break;
      if (Number(m2[2]) !== expected) {
        lines[j] = `${m2[1]}${expected}${m2[3]} ${m2[4]}`;
      }
      expected++;
      j++;
    }
    i = j;
  }
  return lines.join("\n");
}

// Renumbering can change line lengths (e.g. "9." -> "10."), so the cursor
// needs to shift by however much text was inserted/removed before it.
function shiftCursorForRenumber(rawValue, normalizedValue, cursor) {
  const rawLines = rawValue.split("\n");
  const normLines = normalizedValue.split("\n");
  let offset = 0;
  let shifted = cursor;
  for (let i = 0; i < rawLines.length; i++) {
    const rawLen = rawLines[i].length;
    const delta = normLines[i].length - rawLen;
    if (cursor <= offset + rawLen) {
      if (cursor > offset) shifted += delta;
      return shifted;
    }
    shifted += delta;
    offset += rawLen + 1;
  }
  return shifted;
}

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

  // Setting textarea.value directly resets the cursor to the end, and doing
  // it through React state means the DOM update (and cursor reset) happens
  // one render late, so we set the DOM value + cursor together here and
  // dispatch "input" so React's onChange picks up the change without
  // touching the cursor again (it bails out since the value already matches).
  function replaceInstructionsValue(textarea, newValue, newCursor) {
    nativeTextareaValueSetter.call(textarea, newValue);
    textarea.setSelectionRange(newCursor, newCursor);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
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
      replaceInstructionsValue(textarea, newValue, lineStart);
      return;
    }

    // Insert the next marker; handleInstructionsChange renumbers whatever
    // follows once this change lands, so we don't need to do it here too.
    const insertion = `\n${indent}${Number(num) + 1}${delim} `;
    const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
    const newCursor = selectionStart + insertion.length;
    replaceInstructionsValue(textarea, newValue, newCursor);
  }

  // Runs after every edit to the instructions field — typing, pasting,
  // deleting a whole item, backspacing through one character by character,
  // whatever. It doesn't matter how the text changed; this just looks at the
  // result and fixes any numbered list that's no longer sequential.
  function handleInstructionsChange(e) {
    const textarea = e.target;
    const raw = textarea.value;
    const normalized = renumberInstructionsText(raw);

    if (normalized === raw) {
      setInstructions(raw);
      return;
    }

    const newCursor = shiftCursorForRenumber(raw, normalized, textarea.selectionStart);
    nativeTextareaValueSetter.call(textarea, normalized);
    textarea.setSelectionRange(newCursor, newCursor);
    setInstructions(normalized);
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
          onChange={handleInstructionsChange}
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
