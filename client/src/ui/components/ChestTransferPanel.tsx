import type { CSSProperties, ReactElement } from "react";
import type { ItemRarity } from "@odyssey/shared";
import { useContainerStore } from "../../store/container";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";

const RARITY_COLORS: Record<ItemRarity, string> = {
  Common: "#ffffff",
  Uncommon: "#22c55e",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f97316",
  Important: "#eab308"
};

/**
 * Modal that appears when a container is opened. Shows server-provided loot preview (read-only).
 * Single "Claim" button sends claim to server; "Close" dismisses without claiming.
 */
export function ChestTransferPanel(): ReactElement | null {
  const currentContainerId = useContainerStore((s) => s.currentContainerId);
  const nonce = useContainerStore((s) => s.nonce);
  const previewItems = useContainerStore((s) => s.previewItems);
  const previewCurrency = useContainerStore((s) => s.previewCurrency);
  const closeContainer = useContainerStore((s) => s.closeContainer);
  const setInputMode = usePlayerControlStore((s) => s.setInputMode);
  const sendClaimContainer = useGameRoomBridgeStore((s) => s.sendClaimContainer);

  /* Don't render until we have contents; avoids flash when server returns "already looted". */
  if (!currentContainerId || nonce === null) return null;

  const handleClaim = (): void => {
    if (nonce) {
      sendClaimContainer(currentContainerId, nonce);
    }
    closeContainer();
    setInputMode("game");
  };

  const handleClose = (): void => {
    closeContainer();
    setInputMode("game");
  };

  return (
    <div style={backdropStyle} role="presentation">
      <div style={panelStyle} role="dialog" aria-label="Container contents">
        <h2 style={titleStyle}>Container</h2>

        {nonce === null ? (
          <p style={emptyStyle}>Loading...</p>
        ) : (
          <>
            <div style={sectionStyle}>
              <h3 style={columnTitleStyle}>Items</h3>
              {previewItems.length === 0 ? (
                <p style={emptyStyle}>No items</p>
              ) : (
                <ul style={listStyle}>
                  {previewItems.map((item, i) => (
                    <li key={`${item.definitionId}-${i}`} style={itemRowStyle}>
                      <span style={itemNameRarityWrap}>
                        <span style={itemLabelStyle}>{item.name}</span>
                        <span
                          style={{
                            ...itemRarityStyle,
                            color: RARITY_COLORS[item.rarity ?? "Common"]
                          }}
                        >
                          {item.rarity ?? "Common"}
                        </span>
                      </span>
                      <span style={qtyStyle}>x{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {previewCurrency.length > 0 && (
              <div style={sectionStyle}>
                <h3 style={columnTitleStyle}>Currency</h3>
                <ul style={listStyle}>
                  {previewCurrency.map((c, i) => (
                    <li key={`${c.currencyType}-${i}`} style={itemRowStyle}>
                      <span style={itemLabelStyle}>{c.currencyType}</span>
                      <span style={qtyStyle}>+{c.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div style={actionsStyle}>
          <button
            type="button"
            style={confirmBtnStyle}
            onClick={handleClaim}
            disabled={nonce === null}
          >
            Claim
          </button>
          <button type="button" style={cancelBtnStyle} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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

const sectionStyle: CSSProperties = {
  marginBottom: 16
};

const columnTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0
};

const itemRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  marginBottom: 4,
  background: "rgba(30, 41, 59, 0.7)",
  border: "1px solid #475569",
  borderRadius: 6,
  fontSize: 13
};

const itemNameRarityWrap: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: "1 1 auto",
  minWidth: 0
};

const itemLabelStyle: CSSProperties = {
  fontWeight: 600,
  color: "#e2e8f0"
};

const itemRarityStyle: CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  flexShrink: 0
};

const qtyStyle: CSSProperties = {
  color: "#94a3b8",
  fontWeight: 400
};

const emptyStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  textAlign: "center",
  marginTop: 20
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "center",
  marginTop: 20
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
