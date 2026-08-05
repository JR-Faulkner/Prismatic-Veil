// The Prismatic Veil — v33 enemy audio director.
//
// Enemy cues are resolved only through the selected enemy bank.
// There is intentionally no hero-bank fallback. A missing enemy cue is
// silent instead of borrowing Prismel or Kineza's identity.

export const ENEMY_AUDIO_ASSETS = Object.freeze({
  wraith: Object.freeze({
    idle: './assets/sfx/enemy/wraith/wraith_idle.wav',
    release: './assets/sfx/enemy/wraith/wraith_release.wav',
    impact: './assets/sfx/enemy/wraith/wraith_impact.wav',
    hurt: './assets/sfx/enemy/wraith/wraith_hurt.wav',
    defeat: './assets/sfx/enemy/wraith/wraith_defeat.wav'
  }),
  hushling: Object.freeze({
    idle: './assets/sfx/enemy/hushling/hushling_idle.wav',
    release: './assets/sfx/enemy/hushling/hushling_release.wav',
    impact: './assets/sfx/enemy/hushling/hushling_impact.wav',
    hurt: './assets/sfx/enemy/hushling/hushling_hurt.wav',
    defeat: './assets/sfx/enemy/hushling/hushling_defeat.wav'
  })
});

export function preloadEnemyAudio(scene) {
  Object.entries(ENEMY_AUDIO_ASSETS).forEach(([bank, cues]) => {
    Object.entries(cues).forEach(([cue, path]) => {
      scene.load.audio(`enemy_${bank}_${cue}`, path);
    });
  });
}

export default class EnemyAudioDirector {
  constructor(scene, enemy) {
    this.scene = scene;
    this.enemy = enemy;
    this.bankId = enemy.audioBank || enemy.viewId || 'wraith';
    this.sounds = {};
    this._idleTimer = null;
  }

  create() {
    const cues = ENEMY_AUDIO_ASSETS[this.bankId] || {};
    Object.keys(cues).forEach(cue => {
      const key = `enemy_${this.bankId}_${cue}`;
      if (this.scene.cache.audio.exists(key)) {
        this.sounds[cue] = this.scene.sound.add(key, {
          volume: cue === 'idle' ? 0.20 : cue === 'impact' ? 0.86 : 0.72
        });
      }
    });
  }

  play(cue) {
    const sound = this.sounds[cue];
    if (!sound || this.scene.sound.locked) return false;
    if (sound.isPlaying) sound.stop();
    sound.play();
    return true;
  }

  startIdle() {
    this.stopIdle();
    const delay = this.bankId === 'hushling' ? 5100 : 5900;
    this._idleTimer = this.scene.time.addEvent({
      delay,
      loop: true,
      callback: () => {
        const controller = this.scene.controller;
        const enemyView = this.scene.enemyView;
        if (!controller || controller.running || !enemyView || enemyView.pose !== 'idle') return;
        this.play('idle');
      }
    });
  }

  stopIdle() {
    if (this._idleTimer) {
      this._idleTimer.remove(false);
      this._idleTimer = null;
    }
  }

  destroy() {
    this.stopIdle();
    Object.values(this.sounds).forEach(sound => {
      try {
        sound.stop();
        sound.destroy();
      } catch (err) {
        // Scene shutdown may already have removed the sound.
      }
    });
    this.sounds = {};
  }
}
