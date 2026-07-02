import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { RedEventType } from "../../types/entities";
import { generateId } from "../../utils/id";
import { resolveChildName } from "../../storage/selectors";
import { EntityListEditor } from "../../components/shared/EntityListEditor";
import { Modal } from "../../components/shared/Modal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

const GENERAL_VALUE = "__general__";

export function RedTypesSettings() {
  const { children, redEventTypes, addRedEventType, updateRedEventType, archiveRedEventType } = useAppData();
  const [editing, setEditing] = useState<RedEventType | "new" | null>(null);
  const [archiving, setArchiving] = useState<RedEventType | null>(null);

  const [label, setLabel] = useState("");
  const [childValue, setChildValue] = useState(GENERAL_VALUE);

  function openEdit(type: RedEventType | "new") {
    setEditing(type);
    if (type === "new") {
      setLabel("");
      setChildValue(GENERAL_VALUE);
    } else {
      setLabel(type.label);
      setChildValue(type.childId ?? GENERAL_VALUE);
    }
  }

  function handleSave() {
    if (!label.trim()) return;
    const childId = childValue === GENERAL_VALUE ? undefined : childValue;
    if (editing === "new") {
      addRedEventType({ id: generateId(), label: label.trim(), childId });
    } else if (editing) {
      updateRedEventType({ ...editing, label: label.trim(), childId });
    }
    setEditing(null);
  }

  return (
    <div>
      <EntityListEditor
        items={redEventTypes}
        emptyMessage="עוד לא נוספו סוגי אירועים אדומים."
        addLabel="+ הוספת סוג אירוע"
        onAdd={() => openEdit("new")}
        onEdit={(t) => openEdit(t)}
        onArchiveToggle={(t) => setArchiving(t)}
        renderItem={(type) => (
          <div>
            <p style={{ fontWeight: 700 }}>{type.label}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {type.childId ? resolveChildName(type.childId, children) : "כללי"}
            </p>
          </div>
        )}
      />

      {editing && (
        <Modal
          title={editing === "new" ? "הוספת סוג אירוע" : "עריכת סוג אירוע"}
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!label.trim()}>
              שמירה
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="red-type-label">תיאור קצר</label>
            <input id="red-type-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="red-type-scope">שייך ל</label>
            <select id="red-type-scope" value={childValue} onChange={(e) => setChildValue(e.target.value)}>
              <option value={GENERAL_VALUE}>כללי / כל הבית</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.displayName}
                </option>
              ))}
            </select>
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title={archiving.archived ? "שחזור" : "העברה לארכיון"}
          message={
            archiving.archived
              ? `"${archiving.label}" תחזור להופיע כאפשרות פעילה.`
              : `"${archiving.label}" לא תוצג יותר כאפשרות פעילה.`
          }
          onCancel={() => setArchiving(null)}
          onConfirm={() => {
            archiveRedEventType(archiving.id, !archiving.archived);
            setArchiving(null);
          }}
        />
      )}
    </div>
  );
}
