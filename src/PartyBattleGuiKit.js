// FAI-UI-ASSET-01 — Storybook GUI kit integration config.
//
// Source: assets/party_battle_gui/ (copied from the DAI-supplied kit).
// This module is the single place texture keys, file paths, and 9-slice
// insets live, so PartyBattleScene.js's build methods just consume it
// rather than repeating raw paths.
//
// Two assets from the original kit are deliberately NOT included:
// `enemy/enemy_card.png` and `materials/dark_navy_texture.png` both have
// the word "THREAT" baked into them, repeated across the whole surface —
// confirmed at full resolution, not a viewing artifact — and PriZim's own
// consistency report did not catch it (it lists "compact enemy card"
// among the "strongest production candidates" with no caveat). Flagged
// back to DAI; the existing custom-built target card from FAI-HUD-01E is
// kept in place of enemy_card.png until a corrected asset arrives.
export const GUI_TEXTURES = Object.freeze({
  cmdNormal: { key: 'gui_cmd_normal', path: './assets/party_battle_gui/commands/command_button_normal.png' },
  cmdSelected: { key: 'gui_cmd_selected', path: './assets/party_battle_gui/commands/command_button_selected.png' },
  cmdDisabled: { key: 'gui_cmd_disabled', path: './assets/party_battle_gui/commands/command_button_disabled.png' },
  partyNormal: { key: 'gui_party_normal', path: './assets/party_battle_gui/party/party_card_normal.png' },
  partyActive: { key: 'gui_party_active', path: './assets/party_battle_gui/party/party_card_active.png' },
  enemyDiamond: { key: 'gui_enemy_diamond', path: './assets/party_battle_gui/enemy/enemy_portrait_diamond_empty.png' },
  turnNormal: { key: 'gui_turn_normal', path: './assets/party_battle_gui/turn_order/turn_diamond_normal.png' },
  turnActive: { key: 'gui_turn_active', path: './assets/party_battle_gui/turn_order/turn_diamond_active.png' },
  cursorIdle: { key: 'gui_cursor_idle', path: './assets/party_battle_gui/targeting/target_cursor_idle.png' },
  cursorSelected: { key: 'gui_cursor_selected', path: './assets/party_battle_gui/targeting/target_cursor_selected.png' },
  hpShell: { key: 'gui_hp_shell', path: './assets/party_battle_gui/meters/hp_meter_shell_empty.png' },
  rpShell: { key: 'gui_rp_shell', path: './assets/party_battle_gui/meters/rp_meter_shell_empty.png' },
  resonartDrawer: { key: 'gui_resonart_drawer', path: './assets/party_battle_gui/resonart/context_drawer.png' },
  resonartList: { key: 'gui_resonart_list', path: './assets/party_battle_gui/resonart/resonart_list_panel_shell.png' },
  resonartRowNormal: { key: 'gui_resonart_row_normal', path: './assets/party_battle_gui/resonart/resonart_row_normal.png' },
  resonartRowSelected: { key: 'gui_resonart_row_selected', path: './assets/party_battle_gui/resonart/resonart_row_selected.png' },
  itemList: { key: 'gui_item_list', path: './assets/party_battle_gui/items/item_list_panel_shell.png' },
  itemRowNormal: { key: 'gui_item_row_normal', path: './assets/party_battle_gui/items/item_row_normal.png' },
  itemRowSelected: { key: 'gui_item_row_selected', path: './assets/party_battle_gui/items/item_row_selected.png' },
  statusPositive: { key: 'gui_status_positive', path: './assets/party_battle_gui/status/status_positive.png' },
  statusNegative: { key: 'gui_status_negative', path: './assets/party_battle_gui/status/status_negative.png' },
  guardBadge: { key: 'gui_guard_badge', path: './assets/party_battle_gui/status/guard_prepared_badge.png' },
  victoryFrame: { key: 'gui_victory_frame', path: './assets/party_battle_gui/overlays/victory_frame.png' },
  rotateDevice: { key: 'gui_rotate_device', path: './assets/party_battle_gui/overlays/rotate_device_frame.png' },
  cornerOrnament: { key: 'gui_corner_ornament', path: './assets/party_battle_gui/ornaments/corner_ornament.png' }
});

// 9-slice insets (left, right, top, bottom), measured against each raw
// source PNG's own pixel dimensions — matches SCALING_RULES.json's
// "9slice_ok" / "9slice_review" lists. Tuned by eye against the actual
// corner-ornament extent in each asset, then confirmed by screenshot
// (a too-small inset stretches the ornament; a too-large one crops the
// flat body it's supposed to protect).
export const NINESLICE_INSETS = Object.freeze({
  cmdNormal: { left: 30, right: 30, top: 22, bottom: 18 }, // 203x67 raw
  cmdSelected: { left: 32, right: 32, top: 22, bottom: 18 }, // 207x68 raw
  cmdDisabled: { left: 28, right: 28, top: 26, bottom: 22 }, // 199x96 raw
  partyNormal: { left: 34, right: 20, top: 20, bottom: 16 }, // 262x155 raw
  partyActive: { left: 36, right: 22, top: 22, bottom: 18 }, // 274x160 raw
  resonartDrawer: { left: 24, right: 24, top: 24, bottom: 24 } // 557x292 raw
});

export function preloadGuiKit(scene) {
  Object.values(GUI_TEXTURES).forEach(t => scene.load.image(t.key, t.path));
}
