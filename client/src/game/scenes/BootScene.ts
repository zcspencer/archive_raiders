import Phaser from "phaser";

/**
 * Minimal boot scene used for initial scaffold validation.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.add.text(16, 16, "Phaser Booted", { color: "#ffffff" });
    this.cameras.main.setBackgroundColor("#1f2937");
  }
}
