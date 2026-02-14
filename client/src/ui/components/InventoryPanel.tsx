import type { CSSProperties, ReactElement } from "react";
import type { ToolId } from "@odyssey/shared";
import { usePlayerControlStore } from "../../store/playerControl";

/** Visual metadata for each tool type. */
const TOOL_META: Record<ToolId, { label: string; color: string; description: string }> = {
  axe: { label: "Axe", color: "#b45309", description: "Chop trees and clear debris." },
  watering_can: { label: "Watering Can", color: "#0ea5e9", description: "Water crops and seedlings." },
  seeds: { label: "Seeds", color: "#65a30d", description: "Plant new crops in tilled soil." }
};

const ALL_TOOLS: ToolId[] = ["axe", "watering_can", "seeds"];

/**
 * Inventory overlay panel toggled by pressing I.
 * Shows tools and placeholder inventory grid.
 */
export function InventoryPanel(): ReactElement | null {
  const inventoryOpen = usePlayerControlStore((s) => s.inventoryOpen);
  const equippedToolId = usePlayerControlStore((s) => s.equippedToolId);
  const toggleInventory = usePlayerControlStore((s) => s.toggleInventory);

  if (!inventoryOpen) {
    return null;
  }

  return (
    <div style={backdropStyle} onClick={toggleInventory} role="presentation">
      <div
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Inventory"
      >
        <div style={headerStyle}>
          <h2 style={titleStyle}>Inventory</h2>
          <span style={hintStyle}>Press I to close</span>
        </div>

        {/* Tools section */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Tools</h3>
          <div style={toolGridStyle}>
            {ALL_TOOLS.map((toolId) => {
              const meta = TOOL_META[toolId];
              const isEquipped = toolId === equippedToolId;
              return (
                <div key={toolId} style={toolCardStyle(isEquipped, meta.color)}>
                  <div style={toolLabelStyle(meta.color)}>{meta.label}</div>
                  <div style={toolDescStyle}>{meta.description}</div>
                  {isEquipped ? <div style={equippedBadgeStyle}>Equipped</div> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Items section */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Items</h3>
          <div style={itemGridStyle}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={emptySlotStyle} />
            ))}
          </div>
          <p style={emptyHintStyle}>No items yet. Explore the world to find things!</p>
        </div>
      </div>
    </div>
  );
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
  background: "rgba(0, 0, 0, 0.55)",
  zIndex: 150,
  pointerEvents: "auto"
};

const panelStyle: CSSProperties = {
  width: 520,
  maxWidth: "92vw",
  maxHeight: "80vh",
  overflowY: "auto",
  padding: "24px 28px",
  background: "rgba(15, 23, 42, 0.96)",
  border: "2px solid #475569",
  borderRadius: 14,
  boxShadow: "0 12px 48px rgba(0,0,0,0.5)"
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 16
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#f1f5f9"
};

const hintStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b"
};

const sectionStyle: CSSProperties = {
  marginBottom: 20
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 14,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const toolGridStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
};

function toolCardStyle(equipped: boolean, accentColor: string): CSSProperties {
  return {
    position: "relative",
    flex: "1 1 140px",
    padding: "12px 14px",
    background: equipped ? "rgba(255,255,255,0.06)" : "rgba(30, 41, 59, 0.7)",
    border: equipped ? `2px solid ${accentColor}` : "1px solid #334155",
    borderRadius: 10
  };
}

function toolLabelStyle(color: string): CSSProperties {
  return {
    fontSize: 14,
    fontWeight: 700,
    color,
    marginBottom: 4
  };
}

const toolDescStyle: CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  lineHeight: 1.4
};

const equippedBadgeStyle: CSSProperties = {
  position: "absolute",
  top: 6,
  right: 8,
  fontSize: 10,
  fontWeight: 700,
  color: "#a3e635",
  textTransform: "uppercase"
};

const itemGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 6
};

const emptySlotStyle: CSSProperties = {
  aspectRatio: "1",
  background: "rgba(30, 41, 59, 0.5)",
  border: "1px solid #334155",
  borderRadius: 6
};

const emptyHintStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 13,
  color: "#64748b",
  textAlign: "center"
};
