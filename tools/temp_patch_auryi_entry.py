from pathlib import Path

# Upgrade generic Duo-Hybrid frame preparation with an opt-in white-field key.
driver = Path('src/prizim/DuoHybridSequenceDriver.js')
t = driver.read_text()
t = t.replace('// PriZim Duo-Hybrid Sequence Driver v0.6', '// PriZim Duo-Hybrid Sequence Driver v0.7', 1)
anchor = "  async prepareSequenceSource(manifest, version = '1') {"
helper = """  whiteKeyImage(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('[PriZim Duo-Hybrid] White-key canvas unavailable.');
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;
    for (let i = 0; i < px.length; i += 4) {
      const dr = 255 - px[i], dg = 255 - px[i + 1], db = 255 - px[i + 2];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      const max = Math.max(px[i], px[i + 1], px[i + 2]);
      const min = Math.min(px[i], px[i + 1], px[i + 2]);
      const sat = max - min;
      const base = clamp01((dist - 10) / 42);
      const glow = clamp01((sat - 14) / 70) * clamp01((max - 145) / 95) * 0.86;
      px[i + 3] = Math.round(255 * Math.max(base, glow));
    }
    ctx.putImageData(data, 0, 0);
    return canvas;
  }

"""
if 'whiteKeyImage(image)' not in t:
    assert anchor in t, 'driver insertion anchor missing'
    t = t.replace(anchor, helper + anchor, 1)
old = """          const image = await this.loadImage(frame.asset, version);
          frames.push({ image, sx: 0, sy: 0, sw: image.naturalWidth, sh: image.naturalHeight });"""
new = """          let image = await this.loadImage(frame.asset, version);
          if (source.whiteKey === true) image = this.whiteKeyImage(image);
          const iw = image.naturalWidth || image.width;
          const ih = image.naturalHeight || image.height;
          frames.push({ image, sx: 0, sy: 0, sw: iw, sh: ih });"""
assert old in t, 'driver frame-source anchor missing'
t = t.replace(old, new, 1)
driver.write_text(t)

# Add Auryi turn entry to the existing formation adapter. Kineza attack remains untouched.
adapter = Path('src/prizim/DuoHybridPartyFormationView.js')
a = adapter.read_text()
a = a.replace('// PriZim Duo-Hybrid Formation Adapter v0.6', '// PriZim Duo-Hybrid Formation Adapter v0.7', 1)
a = a.replace("import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-6';", "import DuoHybridSequenceDriver from './DuoHybridSequenceDriver.js?v=duo-7';", 1)
config_anchor = "});\n\nexport default class DuoHybridPartyFormationView"
config_insert = """});

const AURYI_ENTRY_DUO = Object.freeze({
  id: 'auryi_turn_entry_v1',
  name: 'Auryi Turn Entry',
  manifest: './pv-data/sequences/auryi_turn_entry.duo.sequence.json',
  version: '7'
});

export default class DuoHybridPartyFormationView"""
assert config_anchor in a, 'adapter config anchor missing'
a = a.replace(config_anchor, config_insert, 1)
old_create = """  create(roster) {
    super.create(roster);
    const actor = this.actors.get('kineza');
    if (!actor) return;

    actor.duoSequenceConfig = KINEZA_BLITZER_DUO;
    actor.attackSheetConfig = KINEZA_BLITZER_DUO;

    this.duoHybrid.prepare(KINEZA_BLITZER_DUO).catch(error => {
      actor.duoPrewarmError = error;
      console.warn('[PriZim Duo-Hybrid] Blitzer prewarm deferred:', error);
    });
  }

  hasAttackSheet(heroId) {"""
new_create = """  create(roster) {
    super.create(roster);

    const kineza = this.actors.get('kineza');
    if (kineza) {
      kineza.duoSequenceConfig = KINEZA_BLITZER_DUO;
      kineza.attackSheetConfig = KINEZA_BLITZER_DUO;
      this.duoHybrid.prepare(KINEZA_BLITZER_DUO).catch(error => {
        kineza.duoPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Blitzer prewarm deferred:', error);
      });
    }

    const auryi = this.actors.get('auryi');
    if (auryi) {
      auryi.duoEntryConfig = AURYI_ENTRY_DUO;
      this.duoHybrid.prepare(AURYI_ENTRY_DUO).catch(error => {
        auryi.duoEntryPrewarmError = error;
        console.warn('[PriZim Duo-Hybrid] Auryi entry prewarm deferred:', error);
      });
    }
  }

  layout() {
    super.layout();
    const auryi = this.actors.get('auryi');
    if (!auryi || auryi._snapshot) return;
    const mul = 1.12;
    auryi.sprite.setScale(auryi.sprite.scaleX * mul, auryi.sprite.scaleY * mul);
    auryi.ghost.setScale(auryi.ghost.scaleX * mul, auryi.ghost.scaleY * mul);
    auryi.ring.setSize(auryi.sprite.displayWidth * 0.5, auryi.sprite.displayWidth * 0.18);
  }

  hasTurnEntry(heroId) {
    if (heroId === 'auryi') return !!this.actors.get(heroId)?.duoEntryConfig;
    return super.hasTurnEntry(heroId);
  }

  async playTurnEntry(heroId) {
    if (heroId !== 'auryi') return super.playTurnEntry(heroId);
    const actor = this.actors.get(heroId);
    if (!actor?.duoEntryConfig) return;
    return this.duoHybrid.playSequence({
      config: actor.duoEntryConfig,
      actor,
      enemyX: actor.sprite.x,
      enemyY: actor.sprite.y,
      onFrame: null
    });
  }

  hasAttackSheet(heroId) {"""
assert old_create in a, 'adapter create anchor missing'
a = a.replace(old_create, new_create, 1)
adapter.write_text(a)

print('Auryi entry patch prepared')
