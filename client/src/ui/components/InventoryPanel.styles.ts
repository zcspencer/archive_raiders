import type { CSSProperties } from "react";

/** Full-screen backdrop behind the inventory modal. */
export const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.55)",
  zIndex: 150,
  pointerEvents: "auto"
};

/** Main panel container. */
export const panelStyle: CSSProperties = {
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

/** Header row with title, wallet, and hint text. */
export const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 16,
  flexWrap: "wrap",
  gap: 8
};

/** Panel title. */
export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#f1f5f9"
};

/** Wallet currency row. */
export const walletStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  fontSize: 13,
  color: "#94a3b8"
};

/** Individual currency label. */
export const walletItemStyle: CSSProperties = {
  fontWeight: 600
};

/** Close-hint label. */
export const hintStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b"
};

/** Generic section wrapper (equipment / items). */
export const sectionStyle: CSSProperties = {
  marginBottom: 20
};

/** Section heading. */
export const sectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 14,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.06em"
};

/** Equipment row layout. */
export const equipRowStyle: CSSProperties = {
  display: "flex",
  gap: 12
};

/** Single equipment slot card. */
export const equipSlotStyle: CSSProperties = {
  flex: 1,
  padding: 10,
  background: "rgba(30, 41, 59, 0.7)",
  border: "1px solid #334155",
  borderRadius: 10
};

/** Label above an equipment slot. */
export const equipLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  display: "block",
  marginBottom: 6
};

/** Placeholder dash inside an empty equipment slot. */
export const equipPlaceholderStyle: CSSProperties = {
  fontSize: 13,
  color: "#64748b"
};

/** 6-column grid for item slots. */
export const itemGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(6, 1fr)",
  gap: 6
};

/** An empty inventory grid cell. */
export const emptySlotStyle: CSSProperties = {
  aspectRatio: "1",
  background: "rgba(30, 41, 59, 0.5)",
  border: "1px solid #334155",
  borderRadius: 6
};

/** An occupied inventory grid cell. */
export const filledSlotStyle: CSSProperties = {
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

/** Item name inside a filled slot. */
export const itemNameStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#e2e8f0",
  textAlign: "center"
};

/** Stack quantity badge. */
export const qtyBadgeStyle: CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
  marginTop: 2
};

/** Context menu popup positioned below the slot. */
export const contextStyle: CSSProperties = {
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

/** Button inside the context menu. */
export const contextBtnStyle: CSSProperties = {
  padding: "4px 10px",
  fontSize: 12,
  cursor: "pointer"
};

/** Hint when inventory is empty. */
export const emptyHintStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  fontSize: 13,
  color: "#64748b",
  textAlign: "center"
};
