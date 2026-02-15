import { useState, type CSSProperties, type ReactElement } from "react";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";
import { usePlayerInventoryStore } from "../../store/playerInventory";
import { usePlayerHotbarStore } from "../../store/playerHotbar";
import { useCurrencyStore } from "../../store/currency";
import { useReadableContentStore } from "../../store/readableContent";
import { getItemDefinition, getReadableParams, hasEquippableComponent } from "../../data/itemDefinitions";

const SLOT_COUNT = 24;

/**
 * Inventory overlay panel toggled by pressing I.
 * Shows currency wallet, equipment slots, and item grid from server state.
 */
export function InventoryPanel(): ReactElement | null {
  const inventoryOpen = usePlayerControlStore((s) => s.inventoryOpen);
  const toggleInventory = usePlayerControlStore((s) => s.toggleInventory);
  const items = usePlayerInventoryStore((s) => s.items);
  const balances = useCurrencyStore((s) => s.balances);
  const addToToolbar = usePlayerHotbarStore((s) => s.addToToolbar);

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
              const isEquippable = def ? hasEquippableComponent(def) : false;
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
                      {isEquippable ? (
                        <button
                          type="button"
                          style={contextBtnStyle}
                          onClick={() => {
                            addToToolbar(item.instanceId);
                            setContextItemId(null);
                          }}
                        >
                          Add to toolbar
                        </button>
                      ) : null}
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
