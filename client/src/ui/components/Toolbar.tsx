import type { CSSProperties, ReactElement } from "react";
import { usePlayerControlStore } from "../../store/playerControl";
import { usePlayerHotbarStore } from "../../store/playerHotbar";
import { usePlayerInventoryStore } from "../../store/playerInventory";
import { getItemDefinition } from "../../data/itemDefinitions";

/** Number of visible hotbar slots. */
const SLOT_COUNT = 9;

const ACCENT_COLOR = "#94a3b8";

/**
 * Toolbar fixed to the bottom center of the screen.
 * Displays 9 hotbar slots with Equippable items from player assignments.
 * Empty slots show a dash; selected slot is highlighted.
 */
export function Toolbar(): ReactElement {
  const selectedSlot = usePlayerControlStore((s) => s.selectedHotbarSlot);
  const slots = usePlayerHotbarStore((s) => s.slots);
  const items = usePlayerInventoryStore((s) => s.items);

  const slotsUi: ReactElement[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const instanceId = slots[i] ?? null;
    const item = instanceId ? findItemByInstanceId(items, instanceId) : null;
    const def = item ? getItemDefinition(item.definitionId) : undefined;
    const label = def?.name ?? (instanceId ? "?" : "—");
    const isSelected = i === selectedSlot;

    slotsUi.push(
      <div key={i} style={slotStyle(isSelected)}>
        <span style={slotIconStyle}>{label}</span>
        <span style={slotKeyStyle}>{i + 1}</span>
      </div>
    );
  }

  return <div style={barStyle}>{slotsUi}</div>;
}

function findItemByInstanceId(items: { instanceId: string; definitionId: string; containedItems?: unknown[] }[], instanceId: string): { instanceId: string; definitionId: string } | undefined {
  for (const item of items) {
    if (item.instanceId === instanceId) return item;
    if (item.containedItems) {
      const found = findItemByInstanceId(item.containedItems as { instanceId: string; definitionId: string; containedItems?: unknown[] }[], instanceId);
      if (found) return found;
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const barStyle: CSSProperties = {
  position: "fixed",
  bottom: 16,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  gap: 4,
  padding: "6px 10px",
  background: "rgba(15, 23, 42, 0.88)",
  border: "2px solid #334155",
  borderRadius: 12,
  zIndex: 50,
  pointerEvents: "auto"
};

function slotStyle(selected: boolean): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    background: selected ? "rgba(255,255,255,0.08)" : "rgba(30, 41, 59, 0.7)",
    border: selected ? `2px solid ${ACCENT_COLOR}` : "2px solid #475569",
    borderRadius: 8,
    cursor: "default",
    transition: "border-color 0.12s, background 0.12s"
  };
}

const slotIconStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#e2e8f0",
  textTransform: "uppercase",
  letterSpacing: "0.02em",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 52
};

const slotKeyStyle: CSSProperties = {
  position: "absolute",
  top: 2,
  right: 4,
  fontSize: 10,
  fontWeight: 600,
  color: "#64748b"
};
