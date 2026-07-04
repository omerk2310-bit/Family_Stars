import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { HeartEventType } from "../../types/entities";
import { generateId } from "../../utils/id";
import { parseIntOrFallback, stripNonDigits } from "../../utils/numericInput";
import { EntityListEditor } from "../../components/shared/EntityListEditor";
import { Modal } from "../../components/shared/Modal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

export function HeartTypesSettings() {
  const { heartEventTypes, addHeartEventType, updateHeartEventType, archiveHeartEventType } = useAppData();
  const [editing, setEditing] = useState<HeartEventType | "new" | null>(null);
  const [archiving, setArchiving] = useState<HeartEventType | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hearts, setHearts] = useState("1");

  function openEdit(type: HeartEventType | "new") {
    setEditing(type);
    if (type === "new") {
      setTitle("");
      setDescription("");
      setHearts("1");
    } else {
      setTitle(type.title);
      setDescription(type.description);
      setHearts(String(type.hearts));
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    const clampedHearts = Math.max(1, parseIntOrFallback(hearts, 1));
    if (editing === "new") {
      addHeartEventType({ id: generateId(), title: title.trim(), description: description.trim(), hearts: clampedHearts });
    } else if (editing) {
      updateHeartEventType({ ...editing, title: title.trim(), description: description.trim(), hearts: clampedHearts });
    }
    setEditing(null);
  }

  return (
    <div>
      <EntityListEditor
        items={heartEventTypes}
        emptyMessage="עוד לא נוספו סוגי אירועים ללב."
        addLabel="+ הוספת סוג אירוע"
        onAdd={() => openEdit("new")}
        onEdit={(t) => openEdit(t)}
        onArchiveToggle={(t) => setArchiving(t)}
        renderItem={(type) => (
          <div>
            <p style={{ fontWeight: 700 }}>{type.title}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{"💗".repeat(type.hearts)}</p>
          </div>
        )}
      />

      {editing && (
        <Modal
          title={editing === "new" ? "הוספת סוג אירוע" : "עריכת סוג אירוע"}
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!title.trim()}>
              שמירה
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="heart-type-title">כותרת</label>
            <input id="heart-type-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="heart-type-desc">תיאור</label>
            <textarea id="heart-type-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="form-field">
            <label htmlFor="heart-type-hearts">לבבות</label>
            <input
              id="heart-type-hearts"
              type="text"
              inputMode="numeric"
              value={hearts}
              onChange={(e) => setHearts(stripNonDigits(e.target.value))}
            />
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title={archiving.archived ? "שחזור" : "העברה לארכיון"}
          message={
            archiving.archived
              ? `"${archiving.title}" תחזור להופיע כאפשרות פעילה.`
              : `"${archiving.title}" לא תוצג יותר כאפשרות פעילה.`
          }
          onCancel={() => setArchiving(null)}
          onConfirm={() => {
            archiveHeartEventType(archiving.id, !archiving.archived);
            setArchiving(null);
          }}
        />
      )}
    </div>
  );
}
