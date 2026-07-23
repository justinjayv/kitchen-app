import MatchGauge from "./MatchGauge";

export default function RecipeDetail({ recipe, matchInfo, onEdit, onDelete, onBack }) {
  const missingSet = new Set((matchInfo?.missing_ingredients || []).map((m) => m.toLowerCase()));

  return (
    <div>
      <button className="back-link" onClick={onBack}>
        ← All recipes
      </button>

      <div className="editor-panel detail-panel">
        <div className="detail-header">
          <div>
            <h1 className="page-title" style={{ fontSize: 28, marginBottom: 8 }}>
              {recipe.title}
            </h1>
            {matchInfo && <MatchGauge percentage={matchInfo.match_percentage} />}
          </div>
          <div className="toolbar">
            <button className="btn" onClick={onEdit}>
              Edit
            </button>
            <button className="btn btn-danger" style={{ border: "1px solid var(--alert)" }} onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>

        <div className="detail-media-row">
          <div className="detail-photo-col">
            {recipe.image_url && (
              <div className="detail-img">
                <div
                  className="detail-img-photo"
                  style={{
                    backgroundImage: `url(${recipe.image_url})`,
                    backgroundPosition: recipe.image_position || "50% 50%",
                    transform: `scale(${recipe.image_scale || 1})`,
                    transformOrigin: recipe.image_position || "50% 50%",
                  }}
                />
              </div>
            )}

            {recipe.recipe_link && (
              <p>
                <a href={recipe.recipe_link} target="_blank" rel="noreferrer">
                  {recipe.recipe_link}
                </a>
              </p>
            )}
          </div>

          <div className="detail-ingredients-col">
            <div className="detail-section-title">Ingredients</div>
            <ul className="ingredient-list">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className={missingSet.has(ing.name.toLowerCase()) ? "missing" : ""}>
                  <span>{ing.name}</span>
                  <span className="qty">{ing.quantity}</span>
                </li>
              ))}
              {recipe.ingredients.length === 0 && <li>No ingredients listed yet.</li>}
            </ul>
          </div>
        </div>

        {recipe.instructions && (
          <>
            <div className="detail-section-title">Instructions</div>
            <div className="instructions-block">{recipe.instructions}</div>
          </>
        )}

        {recipe.notes && (
          <>
            <div className="detail-section-title">Notes</div>
            <div className="notes-block">{recipe.notes}</div>
          </>
        )}
      </div>
    </div>
  );
}
