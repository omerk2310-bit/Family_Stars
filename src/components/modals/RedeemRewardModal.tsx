import { useState } from "react";
import type { Child, Reward } from "../../types/entities";
import { Modal } from "../shared/Modal";

interface RedeemRewardModalProps {
  reward: Reward;
  children: Child[];
  getAvailableStars: (childId: string) => number;
  familyHeartsCurrent: number;
  familyHeartTarget: number;
  onConfirm: (childId?: string) => void;
  onClose: () => void;
}

export function RedeemRewardModal({
  reward,
  children,
  getAvailableStars,
  familyHeartsCurrent,
  familyHeartTarget,
  onConfirm,
  onClose,
}: RedeemRewardModalProps) {
  const isFamily = reward.type === "family";
  const [childId, setChildId] = useState(children.length === 1 ? children[0].id : "");

  const availableStars = childId ? getAvailableStars(childId) : 0;
  const canRedeemPersonal = childId !== "" && availableStars >= reward.cost;
  const familyUnlocked = familyHeartsCurrent >= familyHeartTarget && familyHeartsCurrent >= reward.cost;

  return (
    <Modal
      title={reward.title}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn--primary"
          disabled={isFamily ? !familyUnlocked : !canRedeemPersonal}
          onClick={() => onConfirm(isFamily ? undefined : childId)}
        >
          מימוש פרס
        </button>
      }
    >
      {reward.description && <p>{reward.description}</p>}
      <p className="redeem-reward__cost">
        עלות: {reward.cost} {isFamily ? "💗" : "⭐"}
      </p>

      {isFamily ? (
        !familyUnlocked && (
          <p className="redeem-reward__warning">
            צריך להגיע ל-{familyHeartTarget} לבבות משפחתיים כדי לממש את הפרס הזה.
          </p>
        )
      ) : (
        <>
          <div className="form-field">
            <label htmlFor="redeem-child">עבור מי?</label>
            <select id="redeem-child" value={childId} onChange={(e) => setChildId(e.target.value)}>
              <option value="" disabled>
                בחרו ילדה
              </option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.displayName}
                </option>
              ))}
            </select>
          </div>
          {childId && !canRedeemPersonal && (
            <p className="redeem-reward__warning">אין מספיק כוכבים זמינים ({availableStars} מתוך {reward.cost}).</p>
          )}
        </>
      )}
    </Modal>
  );
}
