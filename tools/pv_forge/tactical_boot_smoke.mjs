import { chromium } from 'playwright';

const url = process.env.PRIZIM_TACTICAL_URL || 'http://127.0.0.1:4173/tactical-shell-06d-clean.html';
const expectedMarker = process.env.PRIZIM_BUILD_MARKER || '';
const requireActiveTurn = ['1', 'true', 'yes', 'on'].includes((process.env.PRIZIM_REQUIRE_ACTIVE_TURN || '').toLowerCase());
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
  if (!response || !response.ok()) {
    record('navigation', `HTTP ${response?.status() ?? 'no response'} for ${url}`);
  }

  await page.waitForTimeout(1200);

  const canvasCount = await page.locator('canvas').count();
  if (canvasCount < 1) record('boot', 'Phaser canvas was not created');

  if (expectedMarker) {
    const actualMarker = await page.evaluate(() => window.PRIZIM_BUILD_MARKER || '');
    if (actualMarker !== expectedMarker) {
      record('delivery', `build marker mismatch: expected ${expectedMarker}, received ${actualMarker || '<none>'}`);
    }
  }

  const loadingState = await page.locator('#loading').evaluate(el => ({
    display: getComputedStyle(el).display,
    text: el.textContent || '',
  })).catch(error => {
    record('boot', `#loading inspection failed: ${error.message}`);
    return null;
  });

  if (loadingState) {
    if (/Boot Error/i.test(loadingState.text)) {
      record('boot', loadingState.text.trim());
    } else if (loadingState.display !== 'none') {
      record('boot', `loading overlay still visible: ${loadingState.text.trim()}`);
    }
  }

  if (requireActiveTurn && failures.length === 0) {
    try {
      await page.waitForFunction(() => {
        const game = window.__PV_GAME__;
        if (!game?.scene) return false;
        return game.scene.getScenes(true).some(scene =>
          scene?.activeTurnBattleSlice && Array.isArray(scene.heroes) && Array.isArray(scene.enemies)
        );
      }, { timeout: 10000 });

      const contract = await page.evaluate(() => {
        const game = window.__PV_GAME__;
        const tactical = game.scene.getScenes(true).find(scene =>
          scene?.activeTurnBattleSlice && Array.isArray(scene.heroes) && Array.isArray(scene.enemies)
        );
        if (!tactical) return { ok: false, reason: 'active Tactical scene not found' };

        const canonIds = ['prismel', 'auryi', 'kineza'];
        const heroes = canonIds.map(id => tactical.heroes.find(hero => hero.id === id)).filter(Boolean);
        const enemies = tactical.enemies.filter(enemy => enemy?.alive);
        if (heroes.length !== canonIds.length) {
          return { ok: false, reason: `missing canon heroes: found ${heroes.map(h => h.id).join(',')}` };
        }
        if (!enemies.length) return { ok: false, reason: 'no living enemies available for active-turn contract' };

        const missed = [];
        for (const hero of heroes) {
          for (const enemy of enemies) {
            if (!tactical.activeTurnBattleSlice.shouldIntercept(hero, enemy)) {
              missed.push(`${hero.id}->${enemy.type || enemy.id || 'enemy'}`);
            }
          }
        }
        if (missed.length) {
          return { ok: false, reason: `active-turn interceptor misses: ${missed.join(', ')}` };
        }

        // Prefer a non-Hushling target because that was the exact hidden
        // escape hatch that previously allowed 06D to fall back to old BP.
        const hero = heroes[0];
        const target = enemies.find(enemy => enemy.type !== 'hushling') || enemies[0];
        tactical.enterLinkedBattle(hero, target, 'attack');

        return {
          ok: true,
          hero: hero.id,
          target: target.type || target.id || 'enemy',
          tacticalKey: tactical.sys?.settings?.key || tactical.constructor?.name || 'tactical'
        };
      });

      if (!contract.ok) {
        record('active-turn', contract.reason);
      } else {
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

        if (ownership.activeHero !== contract.hero) {
          record('active-turn', `ATTACK was not owned by active-turn slice; expected ${contract.hero}, received ${ownership.activeHero || '<none>'}`);
        }
        if (ownership.legacyBpActive) {
          record('active-turn', 'legacy VeilBattleScene became active during 06D ATTACK');
        }
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
