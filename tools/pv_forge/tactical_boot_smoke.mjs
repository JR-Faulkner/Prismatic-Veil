import { chromium } from 'playwright';

const url = process.env.PRIZIM_TACTICAL_URL || 'http://127.0.0.1:4173/tactical-shell-06d-clean.html';
const expectedMarker = process.env.PRIZIM_BUILD_MARKER || '';
const truthy = value => ['1', 'true', 'yes', 'on'].includes((value || '').toLowerCase());
const requireActiveTurn = truthy(process.env.PRIZIM_REQUIRE_ACTIVE_TURN);
const requirePhoneHud = truthy(process.env.PRIZIM_REQUIRE_PHONE_HUD);
const requireAttackStaging = truthy(process.env.PRIZIM_REQUIRE_ATTACK_STAGING);
const viewportWidth = Number(process.env.PRIZIM_VIEWPORT_WIDTH || 844);
const viewportHeight = Number(process.env.PRIZIM_VIEWPORT_HEIGHT || 390);
const dpr = Number(process.env.PRIZIM_DPR || 3);
const failures = [];
let browser;

function record(kind, value) {
  const text = value instanceof Error ? (value.stack || value.message) : String(value);
  failures.push(`${kind}: ${text}`);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportHeight },
    deviceScaleFactor: dpr,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on('pageerror', error => record('pageerror', error));
  page.on('console', msg => {
    if (msg.type() === 'error') record('console.error', msg.text());
  });
  page.on('requestfailed', request => {
    const failure = request.failure();
    record('requestfailed', `${request.url()} :: ${failure?.errorText || 'unknown'}`);
  });

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  if (!response || !response.ok()) record('navigation', `HTTP ${response?.status() ?? 'no response'} for ${url}`);
  await page.waitForTimeout(1200);

  const canvasCount = await page.locator('canvas').count();
  if (canvasCount < 1) record('boot', 'Phaser canvas was not created');

  if (expectedMarker) {
    const actualMarker = await page.evaluate(() => window.PRIZIM_BUILD_MARKER || '');
    if (actualMarker !== expectedMarker) record('delivery', `build marker mismatch: expected ${expectedMarker}, received ${actualMarker || '<none>'}`);
  }

  const loadingState = await page.locator('#loading').evaluate(el => ({
    display: getComputedStyle(el).display,
    text: el.textContent || '',
  })).catch(error => {
    record('boot', `#loading inspection failed: ${error.message}`);
    return null;
  });

  if (loadingState) {
    if (/Boot Error/i.test(loadingState.text)) record('boot', loadingState.text.trim());
    else if (loadingState.display !== 'none') record('boot', `loading overlay still visible: ${loadingState.text.trim()}`);
  }

  if ((requirePhoneHud || requireActiveTurn || requireAttackStaging) && failures.length === 0) {
    await page.waitForFunction(() => {
      const game = window.__PV_GAME__;
      return !!game?.scene?.getScenes(true).find(scene => scene?.activeTurnBattleSlice && Array.isArray(scene.heroes));
    }, { timeout: 10000 });
  }

  if (requirePhoneHud && failures.length === 0) {
    try {
      const hud = await page.evaluate(() => {
        const game = window.__PV_GAME__;
        const tactical = game.scene.getScenes(true).find(scene => scene?._phoneHud06G && Array.isArray(scene.heroes));
        if (!tactical) return { ok: false, reason: 'phone HUD scene not found' };
        const hero = tactical.heroes.find(h => h.id === 'prismel' && h.alive);
        if (!hero) return { ok: false, reason: 'Prismel unavailable for HUD selection smoke' };
        tactical.selectHero(hero);
        tactical.layoutHUD();
        tactical.refreshHUD();

        const d = tactical._phoneHud06G;
        const primary = ['attack', 'resonart'];
        const bad = [];
        for (const kind of primary) {
          const cmd = d.commands[kind];
          if (!cmd?.c?.visible) bad.push(`${kind}:hidden`);
          if (!cmd?.bg?.input?.enabled) bad.push(`${kind}:disabled`);
          const b = cmd?.bg?.getBounds ? cmd.bg.getBounds() : null;
          if (!b || b.right <= 0 || b.left >= tactical.scale.width || b.bottom <= 0 || b.top >= tactical.scale.height) bad.push(`${kind}:offscreen`);
        }
        const legacyVisible = !!tactical.actionMenu?.container?.visible;
        const drawerVisible = !!tactical.heroCardsDrawer?.visible;
        const rootVisible = !!d.root?.visible;
        if (legacyVisible) bad.push('legacy-action-menu-visible');
        if (drawerVisible) bad.push('legacy-drawer-visible');
        if (!rootVisible) bad.push('phone-hud-root-hidden');
        return { ok: bad.length === 0, reason: bad.join(', '), legacyVisible, drawerVisible };
      });
      if (!hud.ok) record('phone-hud', hud.reason || 'phone HUD contract failed');
    } catch (error) {
      record('phone-hud', error);
    }
  }

  if (requireAttackStaging && failures.length === 0) {
    try {
      const staging = await page.evaluate(() => {
        const game = window.__PV_GAME__;
        const tactical = game.scene.getScenes(true).find(scene => scene?.activeTurnBattleSlice && Array.isArray(scene.heroes));
        if (!tactical) return { ok: false, reason: 'active Tactical scene not found for staging contract' };
        const slice = tactical.activeTurnBattleSlice;
        if (typeof slice.stageContract06A !== 'function') return { ok: false, reason: 'stageContract06A unavailable' };

        const auryi = tactical.heroes.find(hero => hero.id === 'auryi' && hero.alive);
        const kineza = tactical.heroes.find(hero => hero.id === 'kineza' && hero.alive);
        if (!auryi || !kineza) return { ok: false, reason: 'Auryi or Kineza unavailable for staging contract' };

        const a = slice.stageContract06A('auryi');
        const k = slice.stageContract06A('kineza');
        const bad = [];
        if (!a || !k) bad.push('missing-stage-contract');
        if (!(a?.stage?.xFrac < 0)) bad.push('auryi-not-ranged-left');
        if (!(a?.stage?.yFrac < 0)) bad.push('auryi-not-hover-raised');
        if (!(Math.max(...(a?.attackTravel || [1])) <= 0.03)) bad.push('auryi-travel-too-large');
        if (!(k?.stage?.xFrac > 0.10)) bad.push('kineza-not-forward-staged');
        if (!(Math.max(...(k?.attackTravel || [0])) >= 0.12)) bad.push('kineza-forward-drive-too-small');
        if (!a || !k || Math.max(...k.attackTravel) <= Math.max(...a.attackTravel) + 0.08) bad.push('hero-stage-separation-too-small');

        const originalHero = slice._activeHero06A;
        const originalFrame = slice._activeFrame06A;
        const originalImg = slice._cutinImage;
        const originalSnapshot = slice._stageSnapshot06A;
        const fake = {
          active: true,
          x: 0,
          y: 0,
          scaleX: 1,
          setOrigin() { return this; },
          setScale(value) { this.scaleX = value; return this; },
          setPosition(x, y) { this.x = x; this.y = y; return this; }
        };

        const snap = (hero, index) => {
          slice._cutinImage = fake;
          slice._activeHero06A = hero;
          slice._activeFrame06A = { phase: 'attack', index };
          slice._layoutCutin();
          return { ...slice._stageSnapshot06A };
        };

        let a0, a4, k0, k4, k5, cutinW;
        try {
          a0 = snap(auryi, 0);
          a4 = snap(auryi, 4);
          k0 = snap(kineza, 0);
          k4 = snap(kineza, 4);
          k5 = snap(kineza, 5);
          cutinW = slice._layoutMetrics().cutin.maxW;
        } finally {
          slice._activeHero06A = originalHero;
          slice._activeFrame06A = originalFrame;
          slice._cutinImage = originalImg;
          slice._stageSnapshot06A = originalSnapshot;
        }

        const finite = [a0?.x, a4?.x, k0?.x, k4?.x, k5?.x, cutinW].every(Number.isFinite);
        if (!finite) bad.push('runtime-stage-snapshot-invalid');
        else {
          if (!(k0.x - a0.x > cutinW * 0.07)) bad.push('kineza-not-closer-than-auryi');
          if (!(k4.x - k0.x > cutinW * 0.07)) bad.push('kineza-punch-does-not-advance');
          if (!(k4.x - k5.x > cutinW * 0.035)) bad.push('kineza-recovery-does-not-return');
          if (!(Math.abs(a4.x - a0.x) < cutinW * 0.08)) bad.push('auryi-ranged-stage-drifts-too-far');
        }

        return { ok: bad.length === 0, reason: bad.join(', '), a0, a4, k0, k4, k5 };
      });
      if (!staging.ok) record('attack-staging', staging.reason || 'Auryi/Kineza attack staging contract failed');
    } catch (error) {
      record('attack-staging', error);
    }
  }

  if (requireActiveTurn && failures.length === 0) {
    try {
      const contract = await page.evaluate(() => {
        const game = window.__PV_GAME__;
        const tactical = game.scene.getScenes(true).find(scene => scene?.activeTurnBattleSlice && Array.isArray(scene.heroes) && Array.isArray(scene.enemies));
        if (!tactical) return { ok: false, reason: 'active Tactical scene not found' };

        const canonIds = ['prismel', 'auryi', 'kineza'];
        const heroes = canonIds.map(id => tactical.heroes.find(hero => hero.id === id)).filter(Boolean);
        const enemies = tactical.enemies.filter(enemy => enemy?.alive);
        if (heroes.length !== canonIds.length) return { ok: false, reason: `missing canon heroes: found ${heroes.map(h => h.id).join(',')}` };
        if (!enemies.length) return { ok: false, reason: 'no living enemies available for active-turn contract' };

        const missed = [];
        for (const hero of heroes) for (const enemy of enemies) {
          if (!tactical.activeTurnBattleSlice.shouldIntercept(hero, enemy)) missed.push(`${hero.id}->${enemy.type || enemy.id || 'enemy'}`);
        }
        if (missed.length) return { ok: false, reason: `active-turn interceptor misses: ${missed.join(', ')}` };

        const hero = heroes[0];
        const target = enemies.find(enemy => enemy.type !== 'hushling') || enemies[0];
        tactical.enterLinkedBattle(hero, target, 'attack');
        return { ok: true, hero: hero.id, target: target.type || target.id || 'enemy' };
      });

      if (!contract.ok) record('active-turn', contract.reason);
      else {
        await page.waitForTimeout(180);
        const ownership = await page.evaluate(() => {
          const game = window.__PV_GAME__;
          const tactical = game.scene.getScenes(true).find(scene => scene?.activeTurnBattleSlice && Array.isArray(scene.heroes));
          const activeHero = tactical?.activeTurnBattleSlice?._activeHero06A?.id || '';
          const legacyBpActive = game.scene.getScenes(true).some(scene => {
            const key = scene?.sys?.settings?.key || '';
            const name = scene?.constructor?.name || '';
            return /VeilBattleScene/i.test(key) || /VeilBattleScene/i.test(name);
          });
          return { activeHero, legacyBpActive };
        });
        if (ownership.activeHero !== contract.hero) record('active-turn', `ATTACK was not owned by active-turn slice; expected ${contract.hero}, received ${ownership.activeHero || '<none>'}`);
        if (ownership.legacyBpActive) record('active-turn', 'legacy VeilBattleScene became active during Tactical ATTACK');
      }
    } catch (error) {
      record('active-turn', error);
    }
  }

  if (failures.length) {
    console.error('PriZim Tactical Boot Smoke: FAIL');
    failures.forEach(f => console.error(`- ${f}`));
    process.exitCode = 1;
  } else {
    console.log('PriZim Tactical Boot Smoke: PASS');
    console.log(`Booted ${url} at ${viewportWidth}x${viewportHeight}, DPR ${dpr}, touch enabled.`);
    if (expectedMarker) console.log(`Verified deployed marker ${expectedMarker}.`);
    if (requirePhoneHud) console.log('Verified phone HUD visibility with legacy command UI disabled.');
    if (requireAttackStaging) console.log('Verified Auryi ranged-hover and Kineza close-range attack staging contract.');
    if (requireActiveTurn) console.log('Verified ATTACK ownership by active-turn slice with legacy BP blocked.');
  }
} catch (error) {
  record('runner', error);
  console.error('PriZim Tactical Boot Smoke: FAIL');
  failures.forEach(f => console.error(`- ${f}`));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
