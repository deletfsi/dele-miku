const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const strictAssets = process.argv.includes('--strict-assets');
const indexPath = path.join(root, 'index.html');

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function warn(message) {
  console.warn(`WARN ${message}`);
}

function extractArray(source, variableName) {
  const startMarker = `var ${variableName} = [`;
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`Cannot find ${variableName}`);

  let cursor = source.indexOf('[', start);
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (; cursor < source.length; cursor += 1) {
    const char = source[cursor];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(source.indexOf('[', start), cursor + 1);
    }
  }
  throw new Error(`Cannot parse ${variableName}`);
}

function extractTracks(html) {
  const literal = extractArray(html, 'mikuTracks');
  return Function(`"use strict"; return (${literal});`)();
}

function fileExists(relPath) {
  const fullPath = path.join(root, relPath.replace(/\//g, path.sep));
  return fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0;
}

function existingSourceFor(track) {
  if (track.audioSources) return track.audioSources.find(fileExists);
  const extensions = ['flac', 'wav', 'mp3'];
  return extensions.map((ext) => `${track.audioBase}.${ext}`).find(fileExists);
}

const html = fs.readFileSync(indexPath, 'utf8');
const tracks = extractTracks(html);
const requiredFunctions = [
  'openMusicPanel',
  'closeMusicPanel',
  'previousTrack',
  'nextTrack',
  'togglePlayMode',
  'togglePlayback',
];

if (tracks.length === 1) pass('playlist is single-track mode');
else fail(`playlist should only contain 世界第一的公主殿下, found ${tracks.length} tracks`);

if (tracks[0] && tracks[0].id === 'world-is-mine' && tracks[0].audioSources?.[0] === 'assets/bgm.mp3') {
  pass('single track is 世界第一的公主殿下 from assets/bgm.mp3');
} else {
  fail('single track is not configured as 世界第一的公主殿下 from assets/bgm.mp3');
}

if (!tracks.some((track) => (track.audioSources || []).some((src) => src.startsWith('assets/audio/')))) {
  pass('playlist does not include secondary audio directory tracks');
} else {
  fail('playlist should not include any assets/audio tracks');
}

for (const track of tracks) {
  if (track.vocal && /初音|Hatsune Miku/i.test(track.vocal)) pass(`track vocal is Hatsune Miku: ${track.title}`);
  else fail(`track vocal is not marked as Hatsune Miku: ${track.title}`);
}

for (const track of tracks) {
  if (Number.isFinite(track.duration) && track.duration > 0) pass(`track has known duration for immediate seeking: ${track.title}`);
  else fail(`track missing known duration for immediate seeking: ${track.title}`);
}

for (const fn of requiredFunctions) {
  if (html.includes(`function ${fn}(`)) pass(`player function present: ${fn}`);
  else fail(`missing player function: ${fn}`);
}

if (html.includes('audioExtensionOrder') && html.includes("'flac'") && html.includes("'wav'") && html.includes("'mp3'")) {
  pass('audio fallback order supports FLAC/WAV/MP3');
} else {
  fail('audio fallback order is incomplete');
}

if (
  html.includes('music-panel-overlay') &&
  html.includes('track-list') &&
  html.includes('music-progress') &&
  html.includes('id="music-prev"') &&
  html.includes('id="music-next"')
) {
  pass('player window, track list, and progress controls exist');
} else {
  fail('player UI controls are incomplete');
}

if (
  html.includes('height: auto;') &&
  html.includes('max-height: min(720px, calc(100svh - 36px));') &&
  html.includes('max-height: calc(100dvh - 24px);') &&
  html.includes('grid-template-rows: auto auto auto auto auto;') &&
  html.includes('#music-prev,') &&
  html.includes('#music-next,') &&
  html.includes('#music-mode') &&
  html.includes('-webkit-overflow-scrolling: touch;') &&
  html.includes('touch-action: pan-y;') &&
  html.includes('function bindTrackListScroll') &&
  html.includes("trackList.addEventListener('wheel'") &&
  html.includes("trackList.addEventListener('touchmove'") &&
  html.includes('function dismissUnveilLayers') &&
  html.includes('#unveil-loader.is-dismissed') &&
  html.includes('z-index: 10030;')
) {
  pass('single-track player keeps compact controls and guarded scrolling');
} else {
  fail('single-track player should keep compact controls and guarded scrolling');
}

if (html.includes('panelOverlay.addEventListener') && html.includes('event.target === panelOverlay')) {
  pass('outside click closes the player window');
} else {
  fail('outside click close behavior is missing');
}

if (html.includes('now-playing-strip') && html.includes('track-playing-indicator') && html.includes('musicBeat')) {
  pass('player exposes animated now-playing indicators');
} else {
  fail('player is missing animated now-playing indicators');
}

if (html.includes('track-thumb') && html.includes("button.appendChild(thumb)") && html.includes('trackPulse')) {
  pass('player uses visual track thumbnails and switch animation');
} else {
  fail('player is missing visual track thumbnails or switch animation');
}

if (html.includes('‹') && html.includes('▶') && html.includes('›') && html.includes('↻')) {
  pass('player controls are icon-first');
} else {
  fail('player controls should be icon-first');
}

if (!html.includes('music-source-link') && !html.includes('music-source-row') && !html.includes('track-badge')) {
  pass('player omits source links and local/pending badges');
} else {
  fail('player should not render source links or local/pending badges');
}

if (
  html.includes('href="mangabill/index.html"') &&
  html.includes('查看更多 MangaBill') &&
  html.includes('mangabill/generated/brand/logo-mark.webp') &&
  html.includes('mangabill/generated/characters/elaina/thumb-01.webp')
) {
  pass('footer exposes a prominent MangaBill gallery link');
} else {
  fail('footer MangaBill gallery link is missing or incomplete');
}

const mangabillIndexPath = path.join(root, 'mangabill', 'index.html');
const mangabillRequiredAssets = [
  path.join(root, 'mangabill', 'assets'),
  path.join(root, 'mangabill', 'generated', 'brand', 'logo-mark.webp'),
  path.join(root, 'mangabill', 'generated', 'brand', 'wechat.png'),
  path.join(root, 'mangabill', 'generated', 'characters', 'elaina', 'thumb-01.webp'),
  path.join(root, 'mangabill', 'generated', 'characters', 'frieren', 'thumb-01.webp'),
  path.join(root, 'mangabill', 'generated', 'characters', 'violet', 'thumb-01.webp'),
  path.join(root, 'mangabill', 'generated', 'characters', 'columbina', 'thumb-01.webp'),
];

if (fs.existsSync(mangabillIndexPath) && fs.statSync(mangabillIndexPath).size > 0) {
  pass('MangaBill static page exists at mangabill/index.html');
} else {
  fail('missing MangaBill static page at mangabill/index.html');
}

const missingMangabillAssets = mangabillRequiredAssets.filter((assetPath) => !fs.existsSync(assetPath));
if (missingMangabillAssets.length === 0) {
  pass('MangaBill static assets required by the footer link are present');
} else {
  fail(`missing MangaBill static assets: ${missingMangabillAssets.map((assetPath) => path.relative(root, assetPath)).join(', ')}`);
}

const mangabillHtml = fs.existsSync(mangabillIndexPath) ? fs.readFileSync(mangabillIndexPath, 'utf8') : '';
if (
  mangabillHtml.includes('function unlockSheetScroll') &&
  mangabillHtml.includes("document.body.classList.remove('sheet-open')") &&
  mangabillHtml.includes("window.addEventListener('hashchange'")
) {
  pass('MangaBill releases WeChat sheet scroll lock on route changes');
} else {
  fail('MangaBill should release sheet-open scroll lock when leaving a post');
}

if (
  !html.includes('音源无法播放') &&
  !html.includes('请检查') &&
  !html.includes('缺少音频') &&
  !html.includes('等待音源') &&
  html.includes('loadingStatusMessages') &&
  html.includes('加载中') &&
  html.includes('正在缓冲')
) {
  pass('player uses user-friendly loading status copy instead of debug errors');
} else {
  fail('player should not expose debug audio error copy');
}

if (
  html.includes('function warmAudioCache') &&
  html.includes('function primeAudioPrefetchLinks') &&
  html.includes("link.rel = 'prefetch'") &&
  html.includes("link.as = 'audio'") &&
  html.includes("cache: 'force-cache'") &&
  html.includes('navigator.connection') &&
  html.includes('saveData')
) {
  pass('player warms audio cache with prefetch and same-origin fetch');
} else {
  fail('player audio cache warmup is incomplete');
}

if (
  html.includes('<audio id="bgm" preload="auto">') &&
  html.includes('primeAudioPrefetchLinks(getBackgroundWarmupIndex(0), audioPrefetchLinkLimit);') &&
  html.includes('warmAudioCache(getBackgroundWarmupIndex(0));') &&
  html.includes('audioBlobUrls') &&
  html.includes('audioWarmupControllers') &&
  html.includes('audioWarmupConcurrency') &&
  html.includes('audioPrefetchLinkLimit') &&
  html.includes('function getBackgroundWarmupIndex') &&
  html.includes('function prioritizeAudioWarmup') &&
  html.includes('function shouldUseConservativeAudioLoading') &&
  html.includes('if (shouldUseConservativeAudioLoading()) return;') &&
  html.includes('audioWarmupQueue = nextQueue.concat(audioWarmupQueue)') &&
  !html.includes('scheduleWarmNextAudio(2600)')
) {
  pass('player eagerly preloads playlist audio beyond the default track');
} else {
  fail('player should keep warming the full playlist, including while audio is playing');
}

if (
  html.includes('function schedulePlaybackFallback') &&
  html.includes('URL.createObjectURL') &&
  html.includes('audioBlobUrls') &&
  html.includes('getCachedAudioSource') &&
  html.includes('audioWarmupPromises[src] || fetchAudioToCache(src)') &&
  html.includes('}, 2500);') &&
  html.includes("fetch(url.href, { cache: 'force-cache'")
) {
  pass('player can fall back to cached blob playback when media loading stalls');
} else {
  fail('player missing stalled media playback fallback');
}

if (
  html.includes('playbackRequestId') &&
  html.includes('var requestId = ++playbackRequestId') &&
  html.includes('requestId !== playbackRequestId')
) {
  pass('player guards stale play callbacks during rapid switching');
} else {
  fail('player should guard stale play callbacks during rapid switching');
}

if (
  html.includes('seekRequestId') &&
  html.includes('pendingSeekSeconds') &&
  html.includes('function commitSeek') &&
  html.includes('function applyPendingSeek') &&
  html.includes('typeof bgm.fastSeek') &&
  html.includes('bgm.currentTime = target') &&
  html.includes('pauseBackgroundForInteractiveAudio') &&
  html.includes('resumeWarmupAfterInteractiveDelay') &&
  html.includes("progress.addEventListener('input'") &&
  html.includes("progress.addEventListener('change'")
) {
  pass('player prioritizes rapid seek interactions over background caching');
} else {
  fail('player should debounce seeks, guard stale seek requests, and pause background caching while seeking');
}

const missingAssets = [];
for (const track of tracks) {
  const existing = existingSourceFor(track);
  if (existing) {
    pass(`audio file present for ${track.title}: ${existing}`);
  } else {
    missingAssets.push(track.title);
  }
}

if (missingAssets.length === 0) {
  pass('all playlist audio files are present');
} else {
  const message = `missing audio files for ${missingAssets.length} track(s): ${missingAssets.join(', ')}`;
  if (strictAssets) fail(message);
  else warn(`${message}; run npm run test:music-assets for strict asset gating`);
}
