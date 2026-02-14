import { useEffect, type CSSProperties, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";
import { bootGame, destroyGame } from "../../game/bootstrap";
import { useColyseusRoom } from "../../hooks/useColyseusRoom";
import { useGameRoomBridgeStore } from "../../store/gameRoomBridge";
import { usePlayerControlStore } from "../../store/playerControl";
import { useDialogueStore } from "../../store/dialogue";
import { useContainerStore } from "../../store/container";
import { useReadableContentStore } from "../../store/readableContent";
import { DialogueBox } from "../components/DialogueBox";
import { ReadableContentDialog } from "../components/ReadableContentDialog";
import { Toolbar } from "../components/Toolbar";
import { InventoryPanel } from "../components/InventoryPanel";
import { ChestTransferPanel } from "../components/ChestTransferPanel";

interface GameScreenProps {
  user: AuthUser;
  accessToken: string;
  classroom: Classroom;
  onLogout: () => void;
}

/**
 * Main game screen: boots Phaser, connects to Colyseus, and renders HUD overlays.
 */
export function GameScreen(props: GameScreenProps): ReactElement {
  const setInputMode = usePlayerControlStore((s) => s.setInputMode);
  const toggleInventory = usePlayerControlStore((s) => s.toggleInventory);
  const inventoryOpen = usePlayerControlStore((s) => s.inventoryOpen);
  const setSelectedHotbarSlot = usePlayerControlStore((s) => s.setSelectedHotbarSlot);
  const dialogueActive = useDialogueStore((s) => s.isActive);
  const containerOpen = useContainerStore((s) => s.currentContainerId !== null);
  const closeContainer = useContainerStore((s) => s.closeContainer);
  const readableOpen = useReadableContentStore((s) => s.isOpen);
  const closeReadable = useReadableContentStore((s) => s.closeReadable);

  const roomConnection = useColyseusRoom({
    accessToken: props.accessToken,
    classroomId: props.classroom.id
  });

  /* Boot Phaser on mount, destroy on unmount. */
  useEffect(() => {
    bootGame();
    return () => {
      destroyGame();
    };
  }, []);

  /* Set input mode to "game" when entering, reset on dialogue close. */
  useEffect(() => {
    setInputMode("game");
  }, [setInputMode]);

  useEffect(() => {
    if (!dialogueActive && !containerOpen) {
      setInputMode("game");
    }
  }, [dialogueActive, containerOpen, setInputMode]);

  /* Global keyboard shortcuts for game mode. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") {
        return;
      }

      if (event.key.toLowerCase() === "i") {
        event.preventDefault();
        toggleInventory();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (readableOpen) {
          closeReadable();
          return;
        }
        if (containerOpen) {
          closeContainer();
          setInputMode("game");
          return;
        }
        if (inventoryOpen) {
          toggleInventory();
        }
        return;
      }

      const slot = hotbarSlotFromKey(event.key);
      if (slot !== null) {
        setSelectedHotbarSlot(slot);
        useGameRoomBridgeStore.getState().sendSelectHotbar(slot);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [containerOpen, closeContainer, inventoryOpen, readableOpen, closeReadable, setInputMode, setSelectedHotbarSlot, toggleInventory]);

  return (
    <>
      {/* Top-right status bar */}
      <div style={statusBarStyle}>
        <span style={classroomLabelStyle}>{props.classroom.name}</span>
        <span style={statusDotStyle(roomConnection.status === "connected")} />
        <span style={userLabelStyle}>{props.user.displayName}</span>
        <button type="button" style={logoutBtnStyle} onClick={props.onLogout}>
          Sign out
        </button>
      </div>

      {/* HUD overlays */}
      <Toolbar />
      <InventoryPanel />
      <ChestTransferPanel />
      <DialogueBox />
      <ReadableContentDialog />

      {/* Connection error toast */}
      {roomConnection.errorMessage ? (
        <div style={errorToastStyle}>{roomConnection.errorMessage}</div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function hotbarSlotFromKey(key: string): number | null {
  if (key === "0") return 9;
  if (key >= "1" && key <= "9") return Number(key) - 1;
  return null;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const statusBarStyle: CSSProperties = {
  position: "fixed",
  top: 10,
  right: 12,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 14px",
  background: "rgba(15, 23, 42, 0.82)",
  border: "1px solid #334155",
  borderRadius: 8,
  zIndex: 50,
  pointerEvents: "auto"
};

const classroomLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#a3e635"
};

function statusDotStyle(connected: boolean): CSSProperties {
  return {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: connected ? "#22c55e" : "#ef4444"
  };
}

const userLabelStyle: CSSProperties = {
  fontSize: 13,
  color: "#cbd5e1"
};

const logoutBtnStyle: CSSProperties = {
  marginLeft: 4,
  padding: "3px 10px",
  fontSize: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid #475569",
  borderRadius: 5,
  color: "#94a3b8",
  cursor: "pointer"
};

const errorToastStyle: CSSProperties = {
  position: "fixed",
  top: 52,
  right: 12,
  maxWidth: 320,
  padding: "8px 14px",
  fontSize: 13,
  color: "#fda4af",
  background: "rgba(127, 29, 29, 0.88)",
  border: "1px solid #991b1b",
  borderRadius: 8,
  zIndex: 50,
  pointerEvents: "auto"
};
