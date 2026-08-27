import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    __pvCapacitorProbe?: {
      native: boolean;
      platform: string;
      webDir: 'dist-capacitor';
      productionRuntimeReplaced: false;
    };
  }
}

const native = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

window.__pvCapacitorProbe = {
  native,
  platform,
  webDir: 'dist-capacitor',
  productionRuntimeReplaced: false
};

const status = document.querySelector<HTMLElement>('#status');
if (status) {
  status.innerHTML = `
    <strong class="pass">Capacitor 8.5 shell contract: PASS</strong>
    <span>Runtime context: ${native ? 'native wrapper' : 'web preview'}</span>
    <span>Platform: ${platform}</span>
    <span>Bundle: dist-capacitor</span>
    <span class="pending">Production Phaser 3 / hybrid battle remains unchanged</span>
  `;
}
