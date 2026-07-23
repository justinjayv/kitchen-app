import { useEffect, useMemo, useState } from "react";
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

export default function RecipesView() {
  const [subview, setSubview] = useState("list"); // list | detail | edit | new
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState("");
  const [filteredIds, setFilteredIds] = useState(null); // null = no ingredient filter active
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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

  if (subview === "new") {
    return (
      <div>
        <button className="back-link" onClick={() => setSubview("list")}>
          ← All recipes
        </button>
        <RecipeEditor onSave={handleCreate} onCancel={() => setSubview("list")} />
      </div>
    );
  }

  if (subview === "edit" && selectedRecipe) {
    return (
      <div>
        <button className="back-link" onClick={() => setSubview("detail")}>
          ← Back to recipe
        </button>
        <RecipeEditor
          initialRecipe={selectedRecipe}
          onSave={handleUpdate}
          onCancel={() => setSubview("detail")}
        />
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

      <div className="recipe-grid">
        {visibleRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onOpen={openDetail} />
        ))}
      </div>
    </div>
  );
}
