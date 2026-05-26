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
const requiredTitles = ['世界第一的公主殿下', '妄想感伤代偿连盟', '千本樱'];
const requiredFunctions = [
  'openMusicPanel',
  'closeMusicPanel',
  'previousTrack',
  'nextTrack',
  'togglePlayMode',
  'togglePlayback',
];

if (tracks.length >= 10 && tracks.length <= 16) pass(`playlist size is in range: ${tracks.length}`);
else fail(`playlist should have 10-16 tracks, found ${tracks.length}`);

if (tracks[0] && tracks[0].title === '世界第一的公主殿下') pass('default track is 世界第一的公主殿下');
else fail('default track is not 世界第一的公主殿下');

for (const title of requiredTitles) {
  if (tracks.some((track) => track.title === title)) pass(`required track present: ${title}`);
  else fail(`missing required track: ${title}`);
}

for (const track of tracks) {
  if (track.vocal && /初音|Hatsune Miku/i.test(track.vocal)) pass(`track vocal is Hatsune Miku: ${track.title}`);
  else fail(`track vocal is not marked as Hatsune Miku: ${track.title}`);
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

if (html.includes('music-panel-overlay') && html.includes('track-list') && html.includes('music-progress')) {
  pass('player window, track list, and progress controls exist');
} else {
  fail('player UI controls are incomplete');
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
