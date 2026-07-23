import { useState } from "react";
import PantryView from "./components/PantryView";
import RecipesView from "./components/RecipesView";
import "./App.css";

export default function App() {
  const [view, setView] = useState("pantry");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">&#9670;</span>
          <div>
            <div className="brand-name">Larder</div>
            <div className="brand-sub">kitchen &amp; recipe index</div>
          </div>
        </div>

        <nav className="nav">
          <button
            className={`nav-item ${view === "pantry" ? "active" : ""}`}
            onClick={() => setView("pantry")}
          >
            <span className="nav-num">01</span>
            Ingredients
          </button>
          <button
            className={`nav-item ${view === "recipes" ? "active" : ""}`}
            onClick={() => setView("recipes")}
          >
            <span className="nav-num">02</span>
            Recipes
          </button>
        </nav>

        <div className="sidebar-foot">
          Track what's on hand, then see which recipes are within reach.
        </div>
      </aside>

      <main className="main-panel">
        {view === "pantry" ? <PantryView /> : <RecipesView />}
      </main>
    </div>
  );
}
