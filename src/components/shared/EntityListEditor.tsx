import { useState, type ReactNode } from "react";
import "./EntityListEditor.css";

interface ArchivableEntity {
  id: string;
  archived?: boolean;
}

interface EntityListEditorProps<T extends ArchivableEntity> {
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
  onEdit: (item: T) => void;
  onArchiveToggle: (item: T) => void;
  onAdd: () => void;
  addLabel: string;
  reorderable?: boolean;
  onReorder?: (orderedIds: string[]) => void;
}

export function EntityListEditor<T extends ArchivableEntity>({
  items,
  emptyMessage,
  renderItem,
  onEdit,
  onArchiveToggle,
  onAdd,
  addLabel,
  reorderable,
  onReorder,
}: EntityListEditorProps<T>) {
  const [showArchived, setShowArchived] = useState(false);

  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);
  const visible = showArchived ? items : active;

  function move(index: number, direction: -1 | 1) {
    if (!onReorder) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= active.length) return;
    const ids = active.map((i) => i.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    onReorder(ids);
  }

  return (
    <div className="entity-list-editor">
      <div className="entity-list-editor__toolbar">
        <button type="button" className="btn btn--primary" onClick={onAdd}>
          {addLabel}
        </button>
        {archived.length > 0 && (
          <button type="button" className="entity-list-editor__toggle" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "הסתר ארכיון" : `הצג ארכיון (${archived.length})`}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="entity-list-editor__empty">{emptyMessage}</p>
      ) : (
        <ul className="entity-list-editor__list">
          {visible.map((item) => {
            const activeIndex = active.findIndex((i) => i.id === item.id);
            return (
              <li key={item.id} className={`entity-list-editor__row ${item.archived ? "entity-list-editor__row--archived" : ""}`}>
                <div className="entity-list-editor__content">{renderItem(item)}</div>
                <div className="entity-list-editor__actions">
                  {reorderable && !item.archived && (
                    <>
                      <button
                        type="button"
                        className="entity-list-editor__icon-btn"
                        onClick={() => move(activeIndex, -1)}
                        disabled={activeIndex <= 0}
                        aria-label="הזז למעלה"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="entity-list-editor__icon-btn"
                        onClick={() => move(activeIndex, 1)}
                        disabled={activeIndex === -1 || activeIndex >= active.length - 1}
                        aria-label="הזז למטה"
                      >
                        ▼
                      </button>
                    </>
                  )}
                  {!item.archived && (
                    <button type="button" className="entity-list-editor__text-btn" onClick={() => onEdit(item)}>
                      עריכה
                    </button>
                  )}
                  <button type="button" className="entity-list-editor__text-btn" onClick={() => onArchiveToggle(item)}>
                    {item.archived ? "שחזור" : "העברה לארכיון"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
