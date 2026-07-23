const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Pantry ----
export const getPantryItems = (search) =>
  request(`/pantry${search ? `?search=${encodeURIComponent(search)}` : ""}`);
export const createPantryItem = (item) =>
  request("/pantry", { method: "POST", body: JSON.stringify(item) });
export const updatePantryItem = (id, item) =>
  request(`/pantry/${id}`, { method: "PUT", body: JSON.stringify(item) });
export const deletePantryItem = (id) =>
  request(`/pantry/${id}`, { method: "DELETE" });

// ---- Recipes ----
export const getRecipes = (search) =>
  request(`/recipes${search ? `?search=${encodeURIComponent(search)}` : ""}`);
export const getRankedRecipes = () => request("/recipes/ranked");
export const filterRecipesByIngredient = (ingredient) =>
  request(`/recipes/filter?ingredient=${encodeURIComponent(ingredient)}`);
export const getRecipe = (id) => request(`/recipes/${id}`);
export const createRecipe = (recipe) =>
  request("/recipes", { method: "POST", body: JSON.stringify(recipe) });
export const updateRecipe = (id, recipe) =>
  request(`/recipes/${id}`, { method: "PUT", body: JSON.stringify(recipe) });
export const deleteRecipe = (id) =>
  request(`/recipes/${id}`, { method: "DELETE" });
