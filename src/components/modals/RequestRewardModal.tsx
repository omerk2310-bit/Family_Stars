import type { Reward } from "../../types/entities";
import { Modal } from "../shared/Modal";

interface RequestRewardModalProps {
  reward: Reward;
  availableBalance: number;
  familyHeartsCurrent: number;
  familyHeartTarget: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function RequestRewardModal({
  reward,
  availableBalance,
  familyHeartsCurrent,
  familyHeartTarget,
  onConfirm,
  onClose,
}: RequestRewardModalProps) {
  const isFamily = reward.type === "family";
  const currencyIcon = isFamily ? "💗" : reward.isGoldStar ? "🌟" : "⭐";
  const familyUnlocked = familyHeartsCurrent >= familyHeartTarget && familyHeartsCurrent >= reward.cost;
  const canRequest = isFamily ? familyUnlocked : availableBalance >= reward.cost;

  return (
    <Modal
      title={reward.title}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary" disabled={!canRequest} onClick={onConfirm}>
          בקשת מימוש
        </button>
      }
    >
      {reward.description && <p>{reward.description}</p>}
      <p className="redeem-reward__cost">
        עלות: {reward.cost} {currencyIcon}
      </p>
      {isFamily ? (
        !familyUnlocked && (
          <p className="redeem-reward__warning">
            צריך להגיע ל-{familyHeartTarget} לבבות משפחתיים כדי לממש את הפרס הזה.
          </p>
        )
      ) : (
        !canRequest && (
          <p className="redeem-reward__warning">
            אין מספיק {reward.isGoldStar ? "כוכבי זהב" : "כוכבים"} זמינים ({availableBalance} מתוך {reward.cost}).
          </p>
        )
      )}
      <p className="settings-form__hint">הבקשה תישלח להורים לאישור.</p>
    </Modal>
  );
}
