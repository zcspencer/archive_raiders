import { useState, type CSSProperties, type ReactElement } from "react";
import type { ToolId } from "@odyssey/shared";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";
import { usePlayerInventoryStore } from "../../store/playerInventory";
import { useCurrencyStore } from "../../store/currency";
import { useReadableContentStore } from "../../store/readableContent";
import { getItemDefinition, getReadableParams } from "../../data/itemDefinitions";

/** Visual metadata for each tool type (legacy; Phase 6 replaces with equipment). */
const TOOL_META: Record<ToolId, { label: string; color: string; description: string }> = {
  axe: { label: "Axe", color: "#b45309", description: "Chop trees and clear debris." },
  watering_can: { label: "Watering Can", color: "#0ea5e9", description: "Water crops and seedlings." },
  seeds: { label: "Seeds", color: "#65a30d", description: "Plant new crops in tilled soil." }
};

const ALL_TOOLS: ToolId[] = ["axe", "watering_can", "seeds"];

const SLOT_COUNT = 24;

/**
 * Inventory overlay panel toggled by pressing I.
 * Shows currency wallet, tools (legacy), equipment slots, and item grid from server state.
 */
export function InventoryPanel(): ReactElement | null {
  const inventoryOpen = usePlayerControlStore((s) => s.inventoryOpen);
  const equippedToolId = usePlayerControlStore((s) => s.equippedToolId);
  const toggleInventory = usePlayerControlStore((s) => s.toggleInventory);
  const items = usePlayerInventoryStore((s) => s.items);
  const balances = useCurrencyStore((s) => s.balances);

  const [contextItemId, setContextItemId] = useState<string | null>(null);
  const openReadable = useReadableContentStore((s) => s.openReadable);
  const sendDropItem = useGameRoomBridgeStore((s) => s.sendDropItem);

  if (!inventoryOpen) {
    return null;
  }

  const topLevel = items;

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
          <div style={walletStyle}>
            <span style={walletItemStyle}>Coins: {balances.coins}</span>
            <span style={walletItemStyle}>Museum: {balances.museum_points}</span>
          </div>
          <span style={hintStyle}>Press I to close</span>
        </div>

        {/* Equipment section (hand/head) */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Equipment</h3>
          <div style={equipRowStyle}>
            <div style={equipSlotStyle}>
              <span style={equipLabelStyle}>Hand</span>
              <div style={equipPlaceholderStyle}>—</div>
            </div>
            <div style={equipSlotStyle}>
              <span style={equipLabelStyle}>Head</span>
              <div style={equipPlaceholderStyle}>—</div>
            </div>
          </div>
        </div>

        {/* Tools section (legacy; Phase 6 removes) */}
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
            {Array.from({ length: SLOT_COUNT }, (_, i) => {
              const item = topLevel[i] ?? null;
              if (!item) {
                return <div key={i} style={emptySlotStyle} />;
              }
              const def = getItemDefinition(item.definitionId);
              const name = def?.name ?? item.definitionId;
              const readableParams = def ? getReadableParams(def) : undefined;
              const canDrop = def?.rarity !== "Important";
              const isContext = contextItemId === item.instanceId;
              return (
                <div
                  key={item.instanceId}
                  style={filledSlotStyle}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextItemId(isContext ? null : item.instanceId);
                  }}
                >
                  <span style={itemNameStyle}>{name}</span>
                  {item.quantity > 1 ? <span style={qtyBadgeStyle}>x{item.quantity}</span> : null}
                  {isContext ? (
                    <div style={contextStyle}>
                      {readableParams ? (
                        <button
                          type="button"
                          style={contextBtnStyle}
                          onClick={() => {
                            const ct = readableParams.contentType === "render" ? "text" : readableParams.contentType;
                            openReadable(name, ct, readableParams.content);
                            setContextItemId(null);
                          }}
                        >
                          Read
                        </button>
                      ) : null}
                      {canDrop ? (
                        <button
                          type="button"
                          style={contextBtnStyle}
                          onClick={() => {
                            sendDropItem(item.instanceId);
                            setContextItemId(null);
                          }}
                        >
                          Drop
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {topLevel.length === 0 ? (
            <p style={emptyHintStyle}>No items yet. Open containers to find things!</p>
          ) : null}
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
  marginBottom: 16,
  flexWrap: "wrap",
  gap: 8
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#f1f5f9"
};

const walletStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  fontSize: 13,
  color: "#94a3b8"
};

const walletItemStyle: CSSProperties = {
  fontWeight: 600
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

const equipRowStyle: CSSProperties = {
  display: "flex",
  gap: 12
};

const equipSlotStyle: CSSProperties = {
  flex: 1,
  padding: 10,
  background: "rgba(30, 41, 59, 0.7)",
  border: "1px solid #334155",
  borderRadius: 10
};

const equipLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  display: "block",
  marginBottom: 6
};

const equipPlaceholderStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b"
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

const filledSlotStyle: CSSProperties = {
  position: "relative",
  aspectRatio: "1",
  background: "rgba(30, 41, 59, 0.8)",
  border: "1px solid #475569",
  borderRadius: 6,
  padding: 6,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center"
};

const itemNameStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#e2e8f0",
  textAlign: "center"
};

const qtyBadgeStyle: CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
  marginTop: 2
};

const contextStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 2,
  background: "rgba(15, 23, 42, 0.98)",
  border: "1px solid #475569",
  borderRadius: 6,
  padding: 4,
  zIndex: 10
};

const contextBtnStyle: CSSProperties = {
  padding: "4px 10px",
  fontSize: 12,
  cursor: "pointer"
};

const emptyHintStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 13,
  color: "#64748b",
  textAlign: "center"
};
