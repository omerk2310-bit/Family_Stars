import { useState } from "react";
import { useAppData } from "../../state/AppDataContext";
import type { Reward, RewardType } from "../../types/entities";
import { generateId } from "../../utils/id";
import { EntityListEditor } from "../../components/shared/EntityListEditor";
import { Modal } from "../../components/shared/Modal";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";

const TYPE_LABELS: Record<RewardType, string> = {
  small: "פרס קטן (כוכבים)",
  medium: "פרס בינוני (כוכבים)",
  family: "פרס משפחתי (לבבות)",
};

export function RewardsSettings() {
  const { rewards, addReward, updateReward, archiveReward, reorderRewards } = useAppData();
  const [editing, setEditing] = useState<Reward | "new" | null>(null);
  const [archiving, setArchiving] = useState<Reward | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(10);
  const [type, setType] = useState<RewardType>("small");
  const [requiresApproval, setRequiresApproval] = useState(false);

  function openEdit(reward: Reward | "new") {
    setEditing(reward);
    if (reward === "new") {
      setTitle("");
      setDescription("");
      setCost(10);
      setType("small");
      setRequiresApproval(false);
    } else {
      setTitle(reward.title);
      setDescription(reward.description ?? "");
      setCost(reward.cost);
      setType(reward.type);
      setRequiresApproval(reward.requiresParentApproval);
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    if (editing === "new") {
      const maxOrder = rewards.reduce((m, r) => Math.max(m, r.order), -1);
      addReward({
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        cost,
        type,
        requiresParentApproval: requiresApproval,
        order: maxOrder + 1,
      });
    } else if (editing) {
      updateReward({
        ...editing,
        title: title.trim(),
        description: description.trim() || undefined,
        cost,
        type,
        requiresParentApproval: requiresApproval,
      });
    }
    setEditing(null);
  }

  return (
    <div>
      <EntityListEditor
        items={rewards}
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
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              {TYPE_LABELS[reward.type]} · {reward.cost}
            </p>
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
            <label htmlFor="reward-type">סוג פרס</label>
            <select id="reward-type" value={type} onChange={(e) => setType(e.target.value as RewardType)}>
              {(Object.keys(TYPE_LABELS) as RewardType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="reward-cost">עלות ({type === "family" ? "לבבות" : "כוכבים"})</label>
            <input
              id="reward-cost"
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <label className="settings-form__row">
            <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} />
            דורש אישור הורה
          </label>
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
