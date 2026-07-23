import { Fragment, useEffect, useMemo, useState } from "react";
import {
  getPantryItems,
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
} from "../api";

const LOCATIONS = ["fridge", "freezer", "pantry", "spices"];
const LOCATION_LABELS = { fridge: "Fridge", freezer: "Freezer", pantry: "Pantry", spices: "Spices" };

const EMPTY_NEW_ITEM = { name: "", quantity: "", unit: "", purchased_date: "", notes: "", location: "pantry" };

export default function PantryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [visibleLocations, setVisibleLocations] = useState(() => new Set(LOCATIONS));
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);

  function toggleLocation(loc) {
    setVisibleLocations((prev) => {
      const next = new Set(prev);
      if (next.has(loc)) next.delete(loc);
      else next.add(loc);
      return next;
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getPantryItems();
      setItems(data);
      setError("");
    } catch (e) {
      setError("Couldn't load the pantry. Is the backend running on :8000?");
    } finally {
      setLoading(false);
    }
  }

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (it) => visibleLocations.has(it.location) && (!q || it.name.toLowerCase().includes(q))
    );
  }, [items, search, visibleLocations]);

  const groupedVisibleItems = useMemo(() => {
    return LOCATIONS.map((loc) => ({
      location: loc,
      items: visibleItems.filter((it) => (it.location || "pantry") === loc),
    })).filter((group) => group.items.length > 0);
  }, [visibleItems]);

  async function handleFieldCommit(item, field, value) {
    const parsedValue = field === "quantity" ? Number(value) || 0 : value;
    if (item[field] === parsedValue) return;
    const updated = { ...item, [field]: parsedValue };
    setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
    try {
      await updatePantryItem(item.id, { [field]: parsedValue });
    } catch (e) {
      setError("Couldn't save that change. Reloading pantry.");
      load();
    }
  }

  async function handleDelete(id) {
    const prev = items;
    setItems((cur) => cur.filter((it) => it.id !== id));
    try {
      await deletePantryItem(id);
    } catch (e) {
      setError("Couldn't delete that item.");
      setItems(prev);
    }
  }

  async function handleAdd() {
    if (!newItem.name.trim()) return;
    try {
      const created = await createPantryItem({
        ...newItem,
        quantity: Number(newItem.quantity) || 0,
      });
      setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewItem(EMPTY_NEW_ITEM);
      setError("");
    } catch (e) {
      setError("Couldn't add that item.");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pantry</h1>
          <p className="page-subtitle">
            Everything currently on hand. Edit any cell directly — changes save as you go.
          </p>
        </div>
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search pantry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="recipe-filter-row">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            className={`chip-toggle${visibleLocations.has(loc) ? " active" : ""}`}
            onClick={() => toggleLocation(loc)}
          >
            {LOCATION_LABELS[loc]}
          </button>
        ))}
      </div>

      <div className="pantry-table-wrap">
        <table className="pantry-table">
          <thead>
            <tr>
              <th style={{ width: "24%" }}>Item</th>
              <th style={{ width: "18%" }}>Quantity</th>
              <th style={{ width: "14%" }}>Location</th>
              <th style={{ width: "16%" }}>Purchased</th>
              <th>Notes</th>
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr className="new-row">
              <td>
                <input
                  placeholder="Add item…"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </td>
              <td>
                <div className="qty-cell">
                  <input
                    type="number"
                    placeholder="0"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                  <input
                    placeholder="unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  />
                </div>
              </td>
              <td>
                <select
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {LOCATION_LABELS[loc]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="date"
                  value={newItem.purchased_date}
                  onChange={(e) => setNewItem({ ...newItem, purchased_date: e.target.value })}
                />
              </td>
              <td>
                <input
                  placeholder="notes"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
              </td>
              <td className="col-actions">
                <button className="btn-text" onClick={handleAdd}>
                  Add
                </button>
              </td>
            </tr>

            {groupedVisibleItems.map((group) => (
              <Fragment key={group.location}>
                <tr className="location-section-header">
                  <td colSpan={6}>
                    {LOCATION_LABELS[group.location]}
                    <span className="section-count">{group.items.length} item{group.items.length === 1 ? "" : "s"}</span>
                  </td>
                </tr>
                {group.items.map((item) => (
                  <PantryRow
                    key={item.id}
                    item={item}
                    onCommit={handleFieldCommit}
                    onDelete={handleDelete}
                  />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && items.length === 0 && (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>Your pantry is empty</strong>
          Add the first item above — name, quantity, and when you bought it.
        </div>
      )}

      {!loading && items.length > 0 && visibleItems.length === 0 && (
        <div className="empty-state" style={{ marginTop: 18 }}>
          <strong>No items match the current filters</strong>
          Try turning on another location above, or clear your search.
        </div>
      )}
    </div>
  );
}

function PantryRow({ item, onCommit, onDelete }) {
  const [local, setLocal] = useState(item);

  useEffect(() => setLocal(item), [item]);

  return (
    <tr>
      <td>
        <input
          value={local.name}
          onChange={(e) => setLocal({ ...local, name: e.target.value })}
          onBlur={(e) => onCommit(item, "name", e.target.value)}
        />
      </td>
      <td className="col-qty">
        <div className="qty-cell">
          <input
            type="number"
            value={local.quantity}
            onChange={(e) => setLocal({ ...local, quantity: e.target.value })}
            onBlur={(e) => onCommit(item, "quantity", e.target.value)}
          />
          <input
            value={local.unit || ""}
            placeholder="unit"
            onChange={(e) => setLocal({ ...local, unit: e.target.value })}
            onBlur={(e) => onCommit(item, "unit", e.target.value)}
          />
          {Number(local.quantity) <= 0 && <span className="low-stock">out</span>}
        </div>
      </td>
      <td>
        <select
          value={local.location || "pantry"}
          onChange={(e) => {
            setLocal({ ...local, location: e.target.value });
            onCommit(item, "location", e.target.value);
          }}
        >
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {LOCATION_LABELS[loc]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="date"
          value={local.purchased_date || ""}
          onChange={(e) => setLocal({ ...local, purchased_date: e.target.value })}
          onBlur={(e) => onCommit(item, "purchased_date", e.target.value)}
        />
      </td>
      <td>
        <input
          value={local.notes || ""}
          onChange={(e) => setLocal({ ...local, notes: e.target.value })}
          onBlur={(e) => onCommit(item, "notes", e.target.value)}
        />
      </td>
      <td className="col-actions">
        <button className="btn-danger" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}>
          ✕
        </button>
      </td>
    </tr>
  );
}
