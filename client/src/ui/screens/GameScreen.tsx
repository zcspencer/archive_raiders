import { useEffect, type CSSProperties, type ReactElement } from "react";
import type { AuthUser, Classroom } from "@odyssey/shared";
import { bootGame, destroyGame } from "../../game/bootstrap";
import { useColyseusRoom } from "../../hooks/useColyseusRoom";
import { usePlayerControlStore } from "../../store/playerControl";
import { useDialogueStore } from "../../store/dialogue";
import { useContainerStore } from "../../store/container";
import { useNotificationStore } from "../../store/notification";
import { useReadableContentStore } from "../../store/readableContent";
import { useChallengeStore } from "../../store/challenge";
import { reloadServerContent, fetchAllContent } from "../../api/dev";
import { ApiError } from "../../api/client";
import { setMapDataOverrides } from "../../game/scenes/BootScene";
import { replaceItemDefinitions } from "../../data/itemDefinitions";
import { replaceTaskDefinitions } from "../../data/taskDefinitions";
import { replaceNpcDefinitions } from "../../game/content/npcDialogue";
import { DialogueBox } from "../components/DialogueBox";
import { ReadableContentDialog } from "../components/ReadableContentDialog";
import { ChallengePanel } from "../components/ChallengePanel";
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
  const dialogueActive = useDialogueStore((s) => s.isActive);
  const containerOpen = useContainerStore((s) => s.currentContainerId !== null);
  const closeContainer = useContainerStore((s) => s.closeContainer);
  const readableOpen = useReadableContentStore((s) => s.isOpen);
  const closeReadable = useReadableContentStore((s) => s.closeReadable);
  const challengeActive = useChallengeStore((s) => s.activeTask !== null);
  const dismissChallenge = useChallengeStore((s) => s.dismiss);
  const notificationMessage = useNotificationStore((s) => s.message);
  const setNotificationMessage = useNotificationStore((s) => s.setMessage);

  const handleReloadContent = async (): Promise<void> => {
    try {
      const [serverResult, content] = await Promise.all([
        reloadServerContent(),
        fetchAllContent()
      ]);

      setMapDataOverrides(content.maps);
      replaceItemDefinitions(Object.values(content.items));
      replaceTaskDefinitions(Object.values(content.tasks));
      replaceNpcDefinitions(Object.values(content.npcs));

      destroyGame();
      bootGame();

      const mapCount = Object.keys(content.maps).length;
      setNotificationMessage(
        `Reloaded: ${mapCount} maps, ${serverResult.items} items`
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to reload content";
      setNotificationMessage(message);
    }
  };

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
    if (!dialogueActive && !containerOpen && !challengeActive) {
      setInputMode("game");
    }
  }, [dialogueActive, containerOpen, challengeActive, setInputMode]);

  /* Auto-dismiss server notification after 4 seconds. */
  useEffect(() => {
    if (!notificationMessage) return;
    const id = setTimeout(() => setNotificationMessage(null), 4000);
    return () => clearTimeout(id);
  }, [notificationMessage, setNotificationMessage]);

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
        if (challengeActive) {
          dismissChallenge();
          setInputMode("game");
          return;
        }
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
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [challengeActive, dismissChallenge, containerOpen, closeContainer, inventoryOpen, readableOpen, closeReadable, setInputMode, toggleInventory]);

  return (
    <>
      {/* Top-right status bar */}
      <div style={statusBarStyle}>
        <span style={classroomLabelStyle}>{props.classroom.name}</span>
        <span style={statusDotStyle(roomConnection.status === "connected")} />
        <span style={userLabelStyle}>{props.user.displayName}</span>
        {import.meta.env.DEV ? (
          <button
            type="button"
            style={logoutBtnStyle}
            onClick={handleReloadContent}
          >
            Reload Content
          </button>
        ) : null}
        <button type="button" style={logoutBtnStyle} onClick={props.onLogout}>
          Sign out
        </button>
      </div>

      {/* HUD overlays */}
      <InventoryPanel />
      <ChestTransferPanel />
      <ChallengePanel />
      <DialogueBox />
      <ReadableContentDialog />

      {/* Connection error toast */}
      {roomConnection.errorMessage ? (
        <div style={errorToastStyle}>{roomConnection.errorMessage}</div>
      ) : null}

      {/* Server notification toast (e.g. "The container is empty") */}
      {notificationMessage ? (
        <div style={notificationToastStyle}>{notificationMessage}</div>
      ) : null}
    </>
  );
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

const notificationToastStyle: CSSProperties = {
  position: "fixed",
  bottom: 100,
  left: "50%",
  transform: "translateX(-50%)",
  maxWidth: 320,
  padding: "10px 18px",
  fontSize: 14,
  color: "#e2e8f0",
  background: "rgba(30, 41, 59, 0.95)",
  border: "1px solid #475569",
  borderRadius: 8,
  zIndex: 50,
  pointerEvents: "auto"
};
