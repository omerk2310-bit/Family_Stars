import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Behavior } from "../../types/entities";
import { generateId } from "../../utils/id";
import { EntityListEditor } from "../../components/shared/EntityListEditor";
import { Modal } from "../../components/shared/Modal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import { EmptyState } from "../../components/layout/EmptyState";

export function BehaviorsSettings() {
  const { children, behaviors, addBehavior, updateBehavior, archiveBehavior } = useAppData();
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [editing, setEditing] = useState<Behavior | "new" | null>(null);
  const [archiving, setArchiving] = useState<Behavior | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [points, setPoints] = useState(5);
  const [isBonus, setIsBonus] = useState(false);
  const [minPoints, setMinPoints] = useState(3);
  const [maxPoints, setMaxPoints] = useState(5);

  const childBehaviors = behaviors.filter((b) => b.childId === childId);

  function openEdit(behavior: Behavior | "new") {
    setEditing(behavior);
    if (behavior === "new") {
      setTitle("");
      setDescription("");
      setCategory("");
      setPoints(5);
      setIsBonus(false);
      setMinPoints(3);
      setMaxPoints(5);
    } else {
      setTitle(behavior.title);
      setDescription(behavior.description);
      setCategory(behavior.category);
      setPoints(behavior.points);
      setIsBonus(behavior.isBonus);
      setMinPoints(behavior.minPoints ?? 3);
      setMaxPoints(behavior.maxPoints ?? 5);
    }
  }

  function handleSave() {
    if (!title.trim() || !childId) return;
    const base = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || "כללי",
      points: isBonus ? minPoints : points,
      isBonus,
      minPoints: isBonus ? minPoints : undefined,
      maxPoints: isBonus ? maxPoints : undefined,
    };

    if (editing === "new") {
      addBehavior({ id: generateId(), childId, archived: false, ...base });
    } else if (editing) {
      updateBehavior({ ...editing, ...base });
    }
    setEditing(null);
  }

  if (children.length === 0) {
    return <EmptyState icon="🌱" title="קודם צריך להוסיף ילדים" message="אפשר להוסיף ילדה בלשונית 'ילדים'." />;
  }

  return (
    <div>
      <div className="form-field">
        <label htmlFor="behavior-child-select">עבור מי?</label>
        <select id="behavior-child-select" value={childId} onChange={(e) => setChildId(e.target.value)}>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.displayName}
            </option>
          ))}
        </select>
      </div>

      <EntityListEditor
        items={childBehaviors}
        emptyMessage="עוד אין התנהגויות עבורה."
        addLabel="+ הוספת התנהגות"
        onAdd={() => openEdit("new")}
        onEdit={(b) => openEdit(b)}
        onArchiveToggle={(b) => setArchiving(b)}
        renderItem={(behavior) => (
          <div>
            <p style={{ fontWeight: 700 }}>{behavior.title}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {behavior.isBonus ? `${behavior.minPoints}–${behavior.maxPoints} ⭐ (בונוס)` : `${behavior.points} ⭐`} · {behavior.category}
            </p>
          </div>
        )}
      />

      {editing && (
        <Modal
          title={editing === "new" ? "הוספת התנהגות" : "עריכת התנהגות"}
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!title.trim()}>
              שמירה
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="behavior-title">כותרת</label>
            <input id="behavior-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="behavior-description">תיאור</label>
            <textarea id="behavior-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="form-field">
            <label htmlFor="behavior-category">קטגוריה</label>
            <input id="behavior-category" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>

          <label className="settings-form__row">
            <input type="checkbox" checked={isBonus} onChange={(e) => setIsBonus(e.target.checked)} />
            התנהגות בונוס (טווח ניקוד)
          </label>

          {isBonus ? (
            <div style={{ display: "flex", gap: 12 }}>
              <div className="form-field" style={{ flex: 1 }}>
                <label htmlFor="behavior-min">מינימום</label>
                <input
                  id="behavior-min"
                  type="number"
                  min={1}
                  value={minPoints}
                  onChange={(e) => setMinPoints(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div className="form-field" style={{ flex: 1 }}>
                <label htmlFor="behavior-max">מקסימום</label>
                <input
                  id="behavior-max"
                  type="number"
                  min={minPoints}
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Math.max(minPoints, Number(e.target.value)))}
                />
              </div>
            </div>
          ) : (
            <div className="form-field">
              <label htmlFor="behavior-points">ניקוד</label>
              <input
                id="behavior-points"
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(Math.max(1, Number(e.target.value)))}
              />
            </div>
          )}
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title={archiving.archived ? "שחזור התנהגות" : "העברה לארכיון"}
          message={
            archiving.archived
              ? `"${archiving.title}" תחזור להופיע כאפשרות פעילה.`
              : `"${archiving.title}" לא תוצג יותר כאפשרות פעילה. אירועים היסטוריים שקשורים אליה יישארו שמורים.`
          }
          onCancel={() => setArchiving(null)}
          onConfirm={() => {
            archiveBehavior(archiving.id, !archiving.archived);
            setArchiving(null);
          }}
        />
      )}
    </div>
  );
}
