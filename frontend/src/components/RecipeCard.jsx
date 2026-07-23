import { useState } from "react";
import MatchGauge from "./MatchGauge";

export default function RecipeCard({ recipe, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const hasMatch = typeof recipe.match_percentage === "number";
  const missing = recipe.missing_ingredients || [];
  const visibleMissing = expanded ? missing : missing.slice(0, 4);

  return (
    <div
      className="recipe-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(recipe.id);
        }
      }}
    >
      <div className="recipe-card-img">
        {recipe.image_url ? (
          <div
            className="recipe-card-img-photo"
            style={{
              backgroundImage: `url(${recipe.image_url})`,
              backgroundPosition: recipe.image_position || "50% 50%",
              transform: `scale(${recipe.image_scale || 1})`,
              transformOrigin: recipe.image_position || "50% 50%",
            }}
          />
        ) : (
          "No photo"
        )}
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>

        {hasMatch && (
          <div className="recipe-card-meta">
            <MatchGauge percentage={recipe.match_percentage} />
          </div>
        )}

        {hasMatch && (
          <div className="missing-chips">
            {missing.length === 0 ? (
              <span className="chip-ready">ready to cook</span>
            ) : (
              visibleMissing.map((m) => (
                <span className="chip-missing" key={m}>
                  {m}
                </span>
              ))
            )}
            {missing.length > 4 && (
              <button
                type="button"
                className="chip-expand-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                aria-expanded={expanded}
                aria-label={expanded ? "Show fewer missing ingredients" : "Show all missing ingredients"}
              >
                {expanded ? "less" : `+${missing.length - 4} more`}
                <span className={`chip-expand-arrow${expanded ? " open" : ""}`}>▾</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
