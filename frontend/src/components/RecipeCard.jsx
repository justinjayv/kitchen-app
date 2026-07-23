import { useState } from "react";
import MatchGauge from "./MatchGauge";

export default function RecipeCard({ recipe, view = "tile", onOpen, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const hasMatch = typeof recipe.match_percentage === "number";
  const missing = recipe.missing_ingredients || [];
  const visibleMissing = expanded ? missing : missing.slice(0, 4);
  const isList = view === "list";

  return (
    <div
      className={`recipe-card${isList ? " recipe-card-list" : ""}`}
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
        {onEdit && (
          <button
            type="button"
            className={`recipe-card-edit-btn${isList ? " compact" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(recipe.id);
            }}
            aria-label={`Edit ${recipe.title}`}
            title="Edit recipe"
          >
            <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
              <path
                d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            {!isList && "Edit"}
          </button>
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
