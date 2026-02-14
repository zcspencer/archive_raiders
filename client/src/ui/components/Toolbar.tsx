import type { CSSProperties, ReactElement } from "react";
import type { ToolId } from "@odyssey/shared";
import { usePlayerControlStore } from "../../store/playerControl";

/** Number of visible hotbar slots. */
const SLOT_COUNT = 9;

/** Visual label for each tool type. */
const TOOL_LABELS: Record<ToolId, string> = {
  axe: "Axe",
  watering_can: "Water",
  seeds: "Seeds"
};

/** Color accent per tool type. */
const TOOL_COLORS: Record<ToolId, string> = {
  axe: "#b45309",
  watering_can: "#0ea5e9",
  seeds: "#65a30d"
};

/** Maps slot index to tool id (cycles through available tools). */
const HOTBAR_TOOL_MAP: readonly ToolId[] = ["axe", "watering_can", "seeds"];

/**
 * Stardew Valley-style toolbar fixed to the bottom center of the screen.
 * Displays 9 hotbar slots with the currently selected slot highlighted.
 */
export function Toolbar(): ReactElement {
  const selectedSlot = usePlayerControlStore((s) => s.selectedHotbarSlot);

  const slots: ReactElement[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const toolId = HOTBAR_TOOL_MAP[i % HOTBAR_TOOL_MAP.length] ?? "axe";
    const isSelected = i === selectedSlot;
    slots.push(
      <div key={i} style={slotStyle(isSelected, TOOL_COLORS[toolId])}>
        <span style={slotIconStyle(TOOL_COLORS[toolId])}>{TOOL_LABELS[toolId]}</span>
        <span style={slotKeyStyle}>{i + 1}</span>
      </div>
    );
  }

  return <div style={barStyle}>{slots}</div>;
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

function slotStyle(selected: boolean, accentColor: string): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    background: selected ? "rgba(255,255,255,0.08)" : "rgba(30, 41, 59, 0.7)",
    border: selected ? `2px solid ${accentColor}` : "2px solid #475569",
    borderRadius: 8,
    cursor: "default",
    transition: "border-color 0.12s, background 0.12s"
  };
}

function slotIconStyle(color: string): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 700,
    color,
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  };
}

const slotKeyStyle: CSSProperties = {
  position: "absolute",
  top: 2,
  right: 4,
  fontSize: 10,
  fontWeight: 600,
  color: "#64748b"
};
