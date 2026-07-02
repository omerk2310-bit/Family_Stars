import { useMemo, useState } from "react";
import type { Behavior, Child, RedEventType } from "../../types/entities";
import { Modal } from "../shared/Modal";
import { Stepper } from "../shared/Stepper";

const GENERAL_CHILD_VALUE = "__general__";

export interface LogRedEventPayload {
  childId?: string;
  redEventTypeId: string;
  note?: string;
  wasRepaired: boolean;
  repairBehaviorId?: string;
  repairPoints?: number;
}

interface LogRedEventModalProps {
  children: Child[];
  redEventTypes: RedEventType[];
  behaviors: Behavior[];
  onConfirm: (payload: LogRedEventPayload) => void;
  onClose: () => void;
}

export function LogRedEventModal({ children, redEventTypes, behaviors, onConfirm, onClose }: LogRedEventModalProps) {
  const [childValue, setChildValue] = useState<string>(children.length === 1 ? children[0].id : "");
  const [typeId, setTypeId] = useState("");
  const [note, setNote] = useState("");
  const [wasRepaired, setWasRepaired] = useState(false);
  const [repairBehaviorId, setRepairBehaviorId] = useState("");
  const [repairPoints, setRepairPoints] = useState(0);

  const selectedChildId = childValue && childValue !== GENERAL_CHILD_VALUE ? childValue : undefined;

  const availableTypes = useMemo(
    () =>
      redEventTypes.filter(
        (t) => !t.archived && (t.childId === undefined || t.childId === selectedChildId)
      ),
    [redEventTypes, selectedChildId]
  );

  const repairBehaviors = useMemo(
    () => (selectedChildId ? behaviors.filter((b) => b.childId === selectedChildId && !b.archived) : []),
    [behaviors, selectedChildId]
  );

  const selectedRepairBehavior = repairBehaviors.find((b) => b.id === repairBehaviorId);

  function handleChildChange(value: string) {
    setChildValue(value);
    setTypeId("");
    setWasRepaired(false);
    setRepairBehaviorId("");
  }

  function handleRepairBehaviorChange(id: string) {
    setRepairBehaviorId(id);
    const behavior = repairBehaviors.find((b) => b.id === id);
    if (behavior) {
      setRepairPoints(behavior.isBonus ? behavior.minPoints ?? behavior.points : behavior.points);
    }
  }

  const canConfirm = childValue !== "" && typeId !== "" && (!wasRepaired || repairBehaviorId !== "");

  function handleConfirm() {
    onConfirm({
      childId: selectedChildId,
      redEventTypeId: typeId,
      note: note.trim() || undefined,
      wasRepaired,
      repairBehaviorId: wasRepaired ? repairBehaviorId : undefined,
      repairPoints: wasRepaired ? repairPoints : undefined,
    });
  }

  return (
    <Modal
      title="רישום אירוע אדום"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--amber" disabled={!canConfirm} onClick={handleConfirm}>
          לשמור אירוע
        </button>
      }
    >
      <div className="form-field">
        <label htmlFor="red-child">מי היה מעורבת?</label>
        <select id="red-child" value={childValue} onChange={(e) => handleChildChange(e.target.value)}>
          <option value="" disabled>
            בחרו אפשרות
          </option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.displayName}
            </option>
          ))}
          <option value={GENERAL_CHILD_VALUE}>כללי / כל הבית</option>
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="red-type">סוג האירוע</label>
        <select id="red-type" value={typeId} onChange={(e) => setTypeId(e.target.value)} disabled={childValue === ""}>
          <option value="" disabled>
            בחרו אפשרות
          </option>
          {availableTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="red-note">הערה (לא חובה)</label>
        <textarea id="red-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>

      <label className="log-red-event__checkbox">
        <input
          type="checkbox"
          checked={wasRepaired}
          disabled={!selectedChildId}
          onChange={(e) => setWasRepaired(e.target.checked)}
        />
        בוצע תיקון?
      </label>
      {!selectedChildId && <p className="log-red-event__hint">כדי לתעד תיקון, יש לבחור ילדה מסוימת.</p>}

      {wasRepaired && selectedChildId && (
        <div className="log-red-event__repair">
          <div className="form-field">
            <label htmlFor="repair-behavior">איזה תיקון היא עשתה?</label>
            <select id="repair-behavior" value={repairBehaviorId} onChange={(e) => handleRepairBehaviorChange(e.target.value)}>
              <option value="" disabled>
                בחרו התנהגות תיקון
              </option>
              {repairBehaviors.map((behavior) => (
                <option key={behavior.id} value={behavior.id}>
                  {behavior.title}
                </option>
              ))}
            </select>
          </div>

          {selectedRepairBehavior?.isBonus && (
            <div className="form-field">
              <label>כמה כוכבים על התיקון?</label>
              <Stepper
                value={repairPoints}
                min={selectedRepairBehavior.minPoints ?? 1}
                max={selectedRepairBehavior.maxPoints ?? selectedRepairBehavior.minPoints ?? 1}
                onChange={setRepairPoints}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
