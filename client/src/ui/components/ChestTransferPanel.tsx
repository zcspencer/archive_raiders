import { useState, type CSSProperties, type ReactElement } from "react";
import type { InventoryStack } from "@odyssey/shared";
import { useChestStore } from "../../store/chest";
import { usePlayerInventoryStore } from "../../store/playerInventory";
import { usePlayerControlStore } from "../../store/playerControl";

/** Display labels for known item IDs. */
const ITEM_LABELS: Record<string, string> = {
  scroll: "Scroll",
  coin: "Coin",
  "ancient-map": "Ancient Map",
  herb: "Herb",
  "artifact-stone-tablet": "Stone Tablet"
};

/** Returns a human-readable label for an item. */
function labelFor(itemId: string): string {
  return ITEM_LABELS[itemId] ?? itemId;
}

/** Stable empty array so selectors do not return a new reference each time. */
const EMPTY_CONTENTS: InventoryStack[] = [];

/**
 * Modal that appears when a chest is opened.
 * Lets the player choose which items to take and which to leave.
 */
export function ChestTransferPanel(): ReactElement | null {
  const currentChestId = useChestStore((s) => s.currentChestId);
  const chestContents = useChestStore((s) =>
    s.currentChestId ? s.contents[s.currentChestId] ?? EMPTY_CONTENTS : EMPTY_CONTENTS
  );
  const setChestContents = useChestStore((s) => s.setChestContents);
  const closeChest = useChestStore((s) => s.closeChest);
  const addItems = usePlayerInventoryStore((s) => s.addItems);
  const setInputMode = usePlayerControlStore((s) => s.setInputMode);

  const [taking, setTaking] = useState<InventoryStack[]>([]);

  if (!currentChestId) return null;

  const remaining = computeRemaining(chestContents, taking);

  const moveToTaking = (itemId: string): void => {
    const src = remaining.find((s) => s.itemId === itemId);
    if (!src || src.quantity <= 0) return;
    setTaking((prev) => addStack(prev, itemId, 1));
  };

  const moveToChest = (itemId: string): void => {
    const src = taking.find((s) => s.itemId === itemId);
    if (!src || src.quantity <= 0) return;
    setTaking((prev) => removeStack(prev, itemId, 1));
  };

  const handleConfirm = (): void => {
    if (taking.length > 0) {
      addItems(taking);
    }
    setChestContents(currentChestId, remaining.filter((s) => s.quantity > 0));
    setTaking([]);
    closeChest();
    setInputMode("game");
  };

  const handleCancel = (): void => {
    setTaking([]);
    closeChest();
    setInputMode("game");
  };

  return (
    <div style={backdropStyle} role="presentation">
      <div style={panelStyle} role="dialog" aria-label="Chest contents">
        <h2 style={titleStyle}>Chest</h2>

        <div style={columnsStyle}>
          {/* In chest */}
          <div style={columnStyle}>
            <h3 style={columnTitleStyle}>In Chest</h3>
            {remaining.length === 0 ? (
              <p style={emptyStyle}>Empty</p>
            ) : (
              remaining.map((stack) => (
                <button
                  key={stack.itemId}
                  type="button"
                  style={itemBtnStyle}
                  onClick={() => moveToTaking(stack.itemId)}
                  title={`Take ${labelFor(stack.itemId)}`}
                >
                  <span style={itemLabelStyle}>{labelFor(stack.itemId)}</span>
                  <span style={qtyStyle}>x{stack.quantity}</span>
                </button>
              ))
            )}
          </div>

          {/* Taking */}
          <div style={columnStyle}>
            <h3 style={columnTitleStyle}>Taking</h3>
            {taking.length === 0 ? (
              <p style={emptyStyle}>Nothing selected</p>
            ) : (
              taking.map((stack) => (
                <button
                  key={stack.itemId}
                  type="button"
                  style={itemBtnTakingStyle}
                  onClick={() => moveToChest(stack.itemId)}
                  title={`Return ${labelFor(stack.itemId)}`}
                >
                  <span style={itemLabelStyle}>{labelFor(stack.itemId)}</span>
                  <span style={qtyStyle}>x{stack.quantity}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div style={actionsStyle}>
          <button type="button" style={confirmBtnStyle} onClick={handleConfirm}>
            Confirm
          </button>
          <button type="button" style={cancelBtnStyle} onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                       */
/* ------------------------------------------------------------------ */

function addStack(list: InventoryStack[], itemId: string, qty: number): InventoryStack[] {
  const copy = list.map((s) => ({ ...s }));
  const existing = copy.find((s) => s.itemId === itemId);
  if (existing) {
    existing.quantity += qty;
  } else {
    copy.push({ itemId, quantity: qty });
  }
  return copy;
}

function removeStack(list: InventoryStack[], itemId: string, qty: number): InventoryStack[] {
  return list
    .map((s) => (s.itemId === itemId ? { ...s, quantity: s.quantity - qty } : { ...s }))
    .filter((s) => s.quantity > 0);
}

function computeRemaining(
  original: InventoryStack[],
  taken: InventoryStack[]
): InventoryStack[] {
  const result = original.map((s) => ({ ...s }));
  for (const t of taken) {
    const entry = result.find((s) => s.itemId === t.itemId);
    if (entry) {
      entry.quantity = Math.max(0, entry.quantity - t.quantity);
    }
  }
  return result.filter((s) => s.quantity > 0);
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.6)",
  zIndex: 200,
  pointerEvents: "auto"
};

const panelStyle: CSSProperties = {
  width: 480,
  maxWidth: "92vw",
  maxHeight: "80vh",
  overflowY: "auto",
  padding: "24px 28px",
  background: "rgba(15, 23, 42, 0.96)",
  border: "2px solid #475569",
  borderRadius: 14,
  boxShadow: "0 12px 48px rgba(0,0,0,0.5)"
};

const titleStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 22,
  fontWeight: 700,
  color: "#f1f5f9",
  textAlign: "center"
};

const columnsStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  marginBottom: 20
};

const columnStyle: CSSProperties = {
  flex: 1,
  minHeight: 120,
  padding: 10,
  background: "rgba(30, 41, 59, 0.6)",
  borderRadius: 10,
  border: "1px solid #334155"
};

const columnTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const emptyStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  textAlign: "center",
  marginTop: 20
};

const itemBtnBase: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  padding: "8px 10px",
  marginBottom: 4,
  border: "1px solid #475569",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13
};

const itemBtnStyle: CSSProperties = {
  ...itemBtnBase,
  background: "rgba(30, 41, 59, 0.7)",
  color: "#e2e8f0"
};

const itemBtnTakingStyle: CSSProperties = {
  ...itemBtnBase,
  background: "rgba(163, 230, 53, 0.12)",
  border: "1px solid #65a30d",
  color: "#a3e635"
};

const itemLabelStyle: CSSProperties = {
  fontWeight: 600
};

const qtyStyle: CSSProperties = {
  color: "#94a3b8",
  fontWeight: 400
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "center"
};

const confirmBtnStyle: CSSProperties = {
  padding: "8px 24px",
  fontSize: 14,
  fontWeight: 700,
  background: "#65a30d",
  color: "#ffffff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer"
};

const cancelBtnStyle: CSSProperties = {
  padding: "8px 24px",
  fontSize: 14,
  fontWeight: 600,
  background: "rgba(255,255,255,0.06)",
  color: "#94a3b8",
  border: "1px solid #475569",
  borderRadius: 8,
  cursor: "pointer"
};
