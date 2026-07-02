import { useState } from "react";
import type { HeartEventType } from "../../types/entities";
import { Modal } from "../shared/Modal";

interface LogHeartEventModalProps {
  heartEventTypes: HeartEventType[];
  onConfirm: (type: HeartEventType, note?: string) => void;
  onClose: () => void;
}

export function LogHeartEventModal({ heartEventTypes, onConfirm, onClose }: LogHeartEventModalProps) {
  const [selected, setSelected] = useState<HeartEventType | null>(null);
  const [note, setNote] = useState("");

  if (!selected) {
    return (
      <Modal title="איזה רגע קרה?" onClose={onClose}>
        <div className="child-screen__behaviors">
          {heartEventTypes.length === 0 ? (
            <p>אין עדיין סוגי אירועים ללב. אפשר להוסיף במסך ההגדרות.</p>
          ) : (
            heartEventTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                className="behavior-button"
                onClick={() => setSelected(type)}
              >
                <div className="behavior-button__main">
                  <span className="behavior-button__title">{type.title}</span>
                  {type.description && <span className="behavior-button__desc">{type.description}</span>}
                </div>
                <div className="behavior-button__meta">
                  <span className="behavior-button__points">{"💗".repeat(type.hearts)}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={selected.title}
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary" onClick={() => onConfirm(selected, note.trim() || undefined)}>
          להוסיף לב
        </button>
      }
    >
      {selected.description && <p>{selected.description}</p>}
      <div className="form-field">
        <label htmlFor="heart-note">הערה (לא חובה)</label>
        <textarea id="heart-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
    </Modal>
  );
}
