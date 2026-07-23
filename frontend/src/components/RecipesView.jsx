import { useEffect, useMemo, useRef, useState } from "react";
import {
  getRankedRecipes,
  filterRecipesByIngredient,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../api";
import RecipeCard from "./RecipeCard";
import RecipeEditor from "./RecipeEditor";
import RecipeDetail from "./RecipeDetail";
import ConfirmExitModal from "./ConfirmExitModal";

export default function RecipesView() {
  const [subview, setSubview] = useState("list"); // list | detail | edit | new
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("tile"); // tile | list
  const [ingredientFilter, setIngredientFilter] = useState("");
  const [filteredIds, setFilteredIds] = useState(null); // null = no ingredient filter active
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);
  const [pendingExit, setPendingExit] = useState(null); // subview to go to if user discards edits
  const editorRef = useRef(null);

  useEffect(() => {
    loadRanked();
  }, []);

  async function loadRanked() {
    setLoading(true);
    try {
      const data = await getRankedRecipes();
      setRanked(data);
      setError("");
    } catch (e) {
      setError("Couldn't load recipes. Is the backend running on :8000?");
    } finally {
      setLoading(false);
    }
  }

  async function handleIngredientFilter(value) {
    setIngredientFilter(value);
    if (!value.trim()) {
      setFilteredIds(null);
      return;
    }
    try {
      const matches = await filterRecipesByIngredient(value.trim());
      setFilteredIds(new Set(matches.map((r) => r.id)));
    } catch (e) {
      setError("Couldn't filter by that ingredient.");
    }
  }

  const visibleRecipes = useMemo(() => {
    let list = ranked;
    if (filteredIds) list = list.filter((r) => filteredIds.has(r.id));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.title.toLowerCase().includes(q));
    return list;
  }, [ranked, search, filteredIds]);

  async function openDetail(id) {
    setSelectedId(id);
    setSubview("detail");
    try {
      const recipe = await getRecipe(id);
      setSelectedRecipe(recipe);
    } catch (e) {
      setError("Couldn't load that recipe.");
      setSubview("list");
    }
  }

  async function openEdit(id) {
    setSelectedId(id);
    try {
      const recipe = await getRecipe(id);
      setSelectedRecipe(recipe);
      setSubview("edit");
    } catch (e) {
      setError("Couldn't load that recipe.");
    }
  }

  async function handleCreate(payload) {
    const created = await createRecipe(payload);
    await loadRanked();
    setSelectedId(created.id);
    setSelectedRecipe(created);
    setSubview("detail");
  }

  async function handleUpdate(payload) {
    const updated = await updateRecipe(selectedId, payload);
    await loadRanked();
    setSelectedRecipe(updated);
    setSubview("detail");
  }

  async function handleDelete() {
    if (!confirm("Delete this recipe? This can't be undone.")) return;
    try {
      await deleteRecipe(selectedId);
      await loadRanked();
      setSubview("list");
    } catch (e) {
      setError("Couldn't delete that recipe.");
    }
  }

  const matchInfo = ranked.find((r) => r.id === selectedId);

  function requestExit(target) {
    if (isEditorDirty) {
      setPendingExit(target);
    } else {
      setSubview(target);
    }
  }

  function handleKeepEditing() {
    setPendingExit(null);
  }

  function handleDiscardExit() {
    const target = pendingExit;
    setPendingExit(null);
    setIsEditorDirty(false);
    setSubview(target);
  }

  function handleSaveExit() {
    setPendingExit(null);
    editorRef.current?.submit();
  }

  if (subview === "new") {
    return (
      <div>
        <button className="back-link" onClick={() => requestExit("list")}>
          ← All recipes
        </button>
        <RecipeEditor
          ref={editorRef}
          onSave={handleCreate}
          onCancel={() => requestExit("list")}
          onDirtyChange={setIsEditorDirty}
        />
        {pendingExit && (
          <ConfirmExitModal
            onKeepEditing={handleKeepEditing}
            onDiscard={handleDiscardExit}
            onSave={handleSaveExit}
          />
        )}
      </div>
    );
  }

  if (subview === "edit" && selectedRecipe) {
    return (
      <div>
        <button className="back-link" onClick={() => requestExit("detail")}>
          ← Back to recipe
        </button>
        <RecipeEditor
          ref={editorRef}
          initialRecipe={selectedRecipe}
          onSave={handleUpdate}
          onCancel={() => requestExit("detail")}
          onDirtyChange={setIsEditorDirty}
        />
        {pendingExit && (
          <ConfirmExitModal
            onKeepEditing={handleKeepEditing}
            onDiscard={handleDiscardExit}
            onSave={handleSaveExit}
          />
        )}
      </div>
    );
  }

  if (subview === "detail" && selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        matchInfo={matchInfo}
        onEdit={() => setSubview("edit")}
        onDelete={handleDelete}
        onBack={() => setSubview("list")}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recipes</h1>
          <p className="page-subtitle">
            Ranked by how much of each ingredient list is already in your pantry.
          </p>
        </div>
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="view-toggle" role="group" aria-label="Recipe view">
            <button
              type="button"
              className={`view-toggle-btn${viewMode === "tile" ? " active" : ""}`}
              onClick={() => setViewMode("tile")}
              aria-pressed={viewMode === "tile"}
              title="Tile view"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
                <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
                <rect x="11.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
                <rect x="2.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
                <rect x="11.5" y="11.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <button
              type="button"
              className={`view-toggle-btn${viewMode === "list" ? " active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              title="List view"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
                <rect x="2.5" y="3.5" width="15" height="2.6" rx="1" fill="currentColor" />
                <rect x="2.5" y="8.7" width="15" height="2.6" rx="1" fill="currentColor" />
                <rect x="2.5" y="13.9" width="15" height="2.6" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setSubview("new")}>
            + New recipe
          </button>
        </div>
      </div>

      <div className="recipe-filter-row">
        <input
          className="search-input"
          placeholder="Filter by ingredient, e.g. egg…"
          value={ingredientFilter}
          onChange={(e) => handleIngredientFilter(e.target.value)}
        />
        {filteredIds && (
          <button className="chip-toggle active" onClick={() => handleIngredientFilter("")}>
            ✕ clear ingredient filter
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!loading && visibleRecipes.length === 0 && (
        <div className="empty-state">
          <strong>No recipes here yet</strong>
          {ranked.length === 0
            ? "Add your first recipe to start tracking what you can cook."
            : "Nothing matches your search or filter."}
        </div>
      )}

      <div className={viewMode === "list" ? "recipe-list" : "recipe-grid"}>
        {visibleRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            view={viewMode}
            onOpen={openDetail}
            onEdit={openEdit}
          />
        ))}
      </div>
    </div>
  );
}
