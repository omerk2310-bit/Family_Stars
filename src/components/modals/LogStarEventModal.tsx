import { useState } from "react";
import type { Behavior } from "../../types/entities";
import { Modal } from "../shared/Modal";
import { Stepper } from "../shared/Stepper";

interface LogStarEventModalProps {
  behavior: Behavior;
  onConfirm: (points: number, note?: string) => void;
  onClose: () => void;
}

export function LogStarEventModal({ behavior, onConfirm, onClose }: LogStarEventModalProps) {
  const defaultPoints = behavior.isBonus ? behavior.minPoints ?? behavior.points : behavior.points;
  const [points, setPoints] = useState(defaultPoints);
  const [half, setHalf] = useState(false);
  const [note, setNote] = useState("");

  const fullPoints = behavior.points;
  const halfPoints = Math.round(behavior.points / 2);
  const effectivePoints = behavior.isBonus ? points : half ? halfPoints : fullPoints;

  return (
    <Modal
      title={behavior.title}
      onClose={onClose}
      footer={
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => onConfirm(effectivePoints, note.trim() || undefined)}
        >
          להוסיף כוכבים
        </button>
      }
    >
      {behavior.description && <p>{behavior.description}</p>}

      {behavior.isBonus ? (
        <div className="form-field">
          <label>כמה כוכבים הפעם?</label>
          <Stepper
            value={points}
            min={behavior.minPoints ?? 1}
            max={behavior.maxPoints ?? behavior.minPoints ?? 1}
            onChange={setPoints}
          />
        </div>
      ) : (
        <div className="form-field">
          <label>ניקוד</label>
          <div className="btn-row">
            <button
              type="button"
              className={`btn ${!half ? "btn--primary" : "btn--secondary"}`}
              onClick={() => setHalf(false)}
            >
              מלא ({fullPoints})
            </button>
            <button
              type="button"
              className={`btn ${half ? "btn--primary" : "btn--secondary"}`}
              onClick={() => setHalf(true)}
            >
              חצי ({halfPoints})
            </button>
          </div>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="star-note">הערה (לא חובה)</label>
        <textarea id="star-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
    </Modal>
  );
}
