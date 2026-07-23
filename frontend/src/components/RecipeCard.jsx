import MatchGauge from "./MatchGauge";

export default function RecipeCard({ recipe, onOpen }) {
  const hasMatch = typeof recipe.match_percentage === "number";
  const missing = recipe.missing_ingredients || [];

  return (
    <button className="recipe-card" onClick={() => onOpen(recipe.id)}>
      <div
        className="recipe-card-img"
        style={
          recipe.image_url
            ? { backgroundImage: `url(${recipe.image_url})` }
            : undefined
        }
      >
        {!recipe.image_url && "No photo"}
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
              missing
                .slice(0, 4)
                .map((m) => (
                  <span className="chip-missing" key={m}>
                    {m}
                  </span>
                ))
            )}
            {missing.length > 4 && (
              <span className="chip-missing">+{missing.length - 4} more</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
