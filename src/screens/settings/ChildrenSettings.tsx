import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Child } from "../../types/entities";
import { generateId } from "../../utils/id";
import { EntityListEditor } from "../../components/shared/EntityListEditor";
import { Modal } from "../../components/shared/Modal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import { ColorPicker } from "../../components/shared/ColorPicker";
import { IconPicker } from "../../components/shared/IconPicker";
import { ChildAvatar } from "../../components/shared/ChildAvatar";

const DEFAULT_COLOR = "#7c5cff";
const DEFAULT_ICON = "🌟";

export function ChildrenSettings() {
  const { children, addChild, updateChild, archiveChild, reorderChildren } = useAppData();
  const [editing, setEditing] = useState<Child | "new" | null>(null);
  const [archiving, setArchiving] = useState<Child | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [icon, setIcon] = useState(DEFAULT_ICON);

  function openEdit(child: Child | "new") {
    setEditing(child);
    if (child === "new") {
      setDisplayName("");
      setName("");
      setColor(DEFAULT_COLOR);
      setIcon(DEFAULT_ICON);
    } else {
      setDisplayName(child.displayName);
      setName(child.name);
      setColor(child.color);
      setIcon(child.icon);
    }
  }

  function handleSave() {
    if (!displayName.trim()) return;
    if (editing === "new") {
      const maxOrder = children.reduce((m, c) => Math.max(m, c.order), -1);
      addChild({
        id: generateId(),
        name: name.trim() || displayName.trim(),
        displayName: displayName.trim(),
        color,
        icon,
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
      });
    } else if (editing) {
      updateChild({ ...editing, displayName: displayName.trim(), name: name.trim() || displayName.trim(), color, icon });
    }
    setEditing(null);
  }

  return (
    <div>
      <EntityListEditor
        items={[...children].sort((a, b) => a.order - b.order)}
        emptyMessage="עוד לא נוספו ילדים."
        addLabel="+ הוספת ילדה"
        onAdd={() => openEdit("new")}
        onEdit={(child) => openEdit(child)}
        onArchiveToggle={(child) => setArchiving(child)}
        reorderable
        onReorder={reorderChildren}
        renderItem={(child) => (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ChildAvatar icon={child.icon} color={child.color} size="sm" />
            <div>
              <p style={{ fontWeight: 700 }}>{child.displayName}</p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{child.name}</p>
            </div>
          </div>
        )}
      />

      {editing && (
        <Modal
          title={editing === "new" ? "הוספת ילדה" : "עריכת ילדה"}
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!displayName.trim()}>
              שמירה
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="child-display-name">שם לתצוגה</label>
            <input id="child-display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="child-name">שם פנימי (לא חובה)</label>
            <input id="child-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-field">
            <label>צבע</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="form-field">
            <label>אייקון</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title={archiving.archived ? "שחזור ילדה" : "העברה לארכיון"}
          message={
            archiving.archived
              ? `${archiving.displayName} תחזור להופיע בדף הבית ובכל המסכים.`
              : `${archiving.displayName} לא תופיע יותר בדף הבית. כל הנתונים ההיסטוריים שלה (כוכבים, אירועים) יישמרו ולא יימחקו.`
          }
          onCancel={() => setArchiving(null)}
          onConfirm={() => {
            archiveChild(archiving.id, !archiving.archived);
            setArchiving(null);
          }}
        />
      )}
    </div>
  );
}
