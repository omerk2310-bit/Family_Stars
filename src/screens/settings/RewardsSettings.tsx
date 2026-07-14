import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Reward } from "../../types/entities";
import { generateId } from "../../utils/id";
import { parseIntOrFallback, stripNonDigits } from "../../utils/numericInput";
import { EntityListEditor } from "../../components/shared/EntityListEditor";
import { Modal } from "../../components/shared/Modal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

// Personal (small/medium) rewards are retired in favor of the instant
// bronze/silver/gold tier system — this form now only manages the family-
// shared reward track, which stays untouched by that pivot.
export function RewardsSettings() {
  const { rewards, addReward, updateReward, archiveReward, reorderRewards } = useAppData();
  const [editing, setEditing] = useState<Reward | "new" | null>(null);
  const [archiving, setArchiving] = useState<Reward | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("10");

  function openEdit(reward: Reward | "new") {
    setEditing(reward);
    if (reward === "new") {
      setTitle("");
      setDescription("");
      setCost("10");
    } else {
      setTitle(reward.title);
      setDescription(reward.description ?? "");
      setCost(String(reward.cost));
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    const clampedCost = Math.max(1, parseIntOrFallback(cost, 1));
    if (editing === "new") {
      const maxOrder = rewards.reduce((m, r) => Math.max(m, r.order), -1);
      addReward({
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        cost: clampedCost,
        type: "family",
        requiresParentApproval: true,
        order: maxOrder + 1,
      });
    } else if (editing) {
      updateReward({
        ...editing,
        title: title.trim(),
        description: description.trim() || undefined,
        cost: clampedCost,
      });
    }
    setEditing(null);
  }

  return (
    <div>
      <EntityListEditor
        items={[...rewards].sort((a, b) => a.order - b.order)}
        emptyMessage="עוד לא נוספו פרסים."
        addLabel="+ הוספת פרס"
        onAdd={() => openEdit("new")}
        onEdit={(r) => openEdit(r)}
        onArchiveToggle={(r) => setArchiving(r)}
        reorderable
        onReorder={reorderRewards}
        renderItem={(reward) => (
          <div>
            <p style={{ fontWeight: 700 }}>{reward.title}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>💗 {reward.cost} לבבות</p>
          </div>
        )}
      />

      {editing && (
        <Modal
          title={editing === "new" ? "הוספת פרס" : "עריכת פרס"}
          onClose={() => setEditing(null)}
          footer={
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={!title.trim()}>
              שמירה
            </button>
          }
        >
          <div className="form-field">
            <label htmlFor="reward-title">כותרת</label>
            <input id="reward-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="reward-desc">תיאור (לא חובה)</label>
            <textarea id="reward-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="form-field">
            <label htmlFor="reward-cost">עלות (לבבות משפחתיים)</label>
            <input
              id="reward-cost"
              type="text"
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(stripNonDigits(e.target.value))}
            />
          </div>
        </Modal>
      )}

      {archiving && (
        <ConfirmDialog
          title={archiving.archived ? "שחזור" : "העברה לארכיון"}
          message={
            archiving.archived
              ? `"${archiving.title}" תחזור להופיע ברשימת הפרסים.`
              : `"${archiving.title}" לא תוצג יותר ברשימת הפרסים.`
          }
          onCancel={() => setArchiving(null)}
          onConfirm={() => {
            archiveReward(archiving.id, !archiving.archived);
            setArchiving(null);
          }}
        />
      )}
    </div>
  );
}
