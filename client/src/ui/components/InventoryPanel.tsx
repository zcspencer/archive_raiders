import { useState, type ReactElement } from "react";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";
import { usePlayerInventoryStore } from "../../store/playerInventory";
import { usePlayerHotbarStore } from "../../store/playerHotbar";
import { useCurrencyStore } from "../../store/currency";
import { useReadableContentStore } from "../../store/readableContent";
import { getItemDefinition, getReadableParams, hasEquippableComponent } from "../../data/itemDefinitions";
import { getTaskDefinition } from "../../data/taskDefinitions";
import { useChallengeStore } from "../../store/challenge";
import {
  backdropStyle,
  panelStyle,
  headerStyle,
  titleStyle,
  walletStyle,
  walletItemStyle,
  hintStyle,
  sectionStyle,
  sectionTitleStyle,
  equipRowStyle,
  equipSlotStyle,
  equipLabelStyle,
  equipPlaceholderStyle,
  itemGridStyle,
  emptySlotStyle,
  filledSlotStyle,
  itemNameStyle,
  qtyBadgeStyle,
  contextStyle,
  contextBtnStyle,
  emptyHintStyle
} from "./InventoryPanel.styles";

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
                            setContextItemId(null);
                            if (readableParams.taskId) {
                              const task = getTaskDefinition(readableParams.taskId);
                              if (task) {
                                useChallengeStore.getState().startChallenge(task, () => {
                                  const ct = readableParams.contentType === "render" ? "text" : readableParams.contentType;
                                  openReadable(name, ct, readableParams.content);
                                });
                                return;
                              }
                            }
                            const ct = readableParams.contentType === "render" ? "text" : readableParams.contentType;
                            openReadable(name, ct, readableParams.content);
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

