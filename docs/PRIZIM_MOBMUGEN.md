# PriZim MOBMUGEN Harness

PriZim now provides a three-layer validation path for MOBMUGEN so experimental builds do not all have to reach the iPhone manually.

## Layer 1: static preflight
`tools/prizim/mobmugen/preflight.py` validates the current Rig F page before browser execution. It checks the modern BoxedWine core, Wine 3.1 root, D: launch path, memory storage, current JIT safety flag, local root parts, controls, and guards against legacy Wine-root regression.

## Layer 2: browser simulation
`tools/prizim/mobmugen/runtime_probe.mjs` launches Chromium through Playwright, opens the actual Rig F page, injects controller input, selects a generated synthetic WinMUGEN ZIP, and validates the selective ZIP stream through `DIRECT ZIP STREAM READY`.

The synthetic fixture is deliberately tiny and is not a replacement for the user's real WinMUGEN archive. It catches page/script/ZIP/input/plumbing regressions cheaply before phone testing.

## Layer 3: real-runtime trace analysis
`tools/prizim/mobmugen/trace_analyzer.py` classifies copied MOBMUGEN traces. It detects video witness, delivered input, Wine 3.1 load, JIT flags, Mono/Gecko evidence, code-invalidation warnings, WASM exceptions, and fatal out-of-bounds crashes.

## Phone witness remains authoritative
PriZim cannot perfectly reproduce iPhone Safari/WebKit memory pressure or the user's 1.7 GB archive in GitHub Actions. Builds that pass PriZim still require an iPhone witness before being called mobile-stable.

## CI behavior
`.github/workflows/prizim-mobmugen.yml` runs automatically when Rig F, BoxedWine F7 assets, or the PriZim MOBMUGEN harness changes. It can also be run manually. Reports are uploaded as workflow artifacts.

## Next expansion
The next step is a lawful slim WinMUGEN runtime fixture. Once available, PriZim can extend Layer 2 from loader simulation to full video/input/timed-survival A/B runs for JIT, interpreter/fallback, and hybrid modes.
