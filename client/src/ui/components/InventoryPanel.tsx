import { useState, type ReactElement } from "react";
import { EQUIPMENT_SLOTS } from "@odyssey/shared";
import type { ItemInstance } from "@odyssey/shared";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";
import { usePlayerEquipmentStore } from "../../store/playerEquipment";
import { usePlayerInventoryStore } from "../../store/playerInventory";
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
  equipUnequipBtnStyle,
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
 * Finds an item by instanceId in a flat or nested item list.
 */
function findItemByInstanceId(
  list: ItemInstance[],
  instanceId: string
): ItemInstance | undefined {
  for (const item of list) {
    if (item.instanceId === instanceId) return item;
    if (item.containedItems?.length) {
      const found = findItemByInstanceId(item.containedItems, instanceId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Inventory overlay panel toggled by pressing I.
 * Shows currency wallet, equipment slots, and item grid from server state.
 */
export function InventoryPanel(): ReactElement | null {
  const inventoryOpen = usePlayerControlStore((s) => s.inventoryOpen);
  const toggleInventory = usePlayerControlStore((s) => s.toggleInventory);
  const items = usePlayerInventoryStore((s) => s.items);
  const equipment = usePlayerEquipmentStore((s) => s.equipment);
  const balances = useCurrencyStore((s) => s.balances);
  const sendEquipItem = useGameRoomBridgeStore((s) => s.sendEquipItem);
  const sendUnequipItem = useGameRoomBridgeStore((s) => s.sendUnequipItem);

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

        {/* Equipment section (data-driven from EQUIPMENT_SLOTS) */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Equipment</h3>
          <div style={equipRowStyle}>
            {EQUIPMENT_SLOTS.map((slot) => {
              const instanceId = equipment[slot] ?? null;
              const item = instanceId ? findItemByInstanceId(items, instanceId) : null;
              const def = item ? getItemDefinition(item.definitionId) : undefined;
              const label = def?.name ?? "—";
              return (
                <div key={slot} style={equipSlotStyle}>
                  <span style={equipLabelStyle}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</span>
                  <div style={equipPlaceholderStyle}>{label}</div>
                  {instanceId ? (
                    <button
                      type="button"
                      style={equipUnequipBtnStyle}
                      onClick={() => sendUnequipItem(slot)}
                    >
                      Unequip
                    </button>
                  ) : null}
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
                            sendEquipItem(item.instanceId);
                            setContextItemId(null);
                          }}
                        >
                          Equip
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

