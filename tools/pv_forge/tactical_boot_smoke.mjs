import { chromium } from 'playwright';

const url = process.env.PRIZIM_TACTICAL_URL || 'http://127.0.0.1:4173/tactical-shell-06d-clean.html';
const expectedMarker = process.env.PRIZIM_BUILD_MARKER || '';
const truthy = value => ['1', 'true', 'yes', 'on'].includes((value || '').toLowerCase());
const requireActiveTurn = truthy(process.env.PRIZIM_REQUIRE_ACTIVE_TURN);
const requirePhoneHud = truthy(process.env.PRIZIM_REQUIRE_PHONE_HUD);
const failures = [];
let browser;

function record(kind, value) {
  const text = value instanceof Error ? (value.stack || value.message) : String(value);
  failures.push(`${kind}: ${text}`);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 3,
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

  const findTactical = () => {
    const game = window.__PV_GAME__;
    if (!game?.scene) return null;
    return game.scene.getScenes(true).find(scene =>
      scene?.activeTurnBattleSlice && Array.isArray(scene.heroes) && Array.isArray(scene.enemies)
    ) || null;
  };

  if ((requirePhoneHud || requireActiveTurn) && failures.length === 0) {
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
        if (!tactical) return { ok: false, reason: 'PHONE-06 HUD scene not found' };
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
      if (!hud.ok) record('phone-hud', hud.reason || 'PHONE-06 HUD contract failed');
    } catch (error) {
      record('phone-hud', error);
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
    console.log(`Booted ${url} at 844x390, DPR 3, touch enabled.`);
    if (expectedMarker) console.log(`Verified deployed marker ${expectedMarker}.`);
    if (requirePhoneHud) console.log('Verified PHONE-06 HUD is visible with legacy command UI disabled.');
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
