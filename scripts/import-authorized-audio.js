const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const audioDir = path.join(root, 'assets', 'audio');
const allowedExtensions = ['flac', 'wav', 'mp3'];

const tracks = [
  {
    title: '妄想感伤代偿连盟',
    stem: 'mousou-kanshou-daishou-renmei',
    aliases: ['妄想感傷代償連盟', '妄想感伤代偿连盟', 'Mousou Kanshou Daishou Renmei'],
  },
  {
    title: '千本樱',
    stem: 'senbonzakura',
    aliases: ['千本桜', '千本樱', 'Senbonzakura', 'Senbon Zakura'],
  },
  {
    title: 'Melt',
    stem: 'melt',
    aliases: ['メルト', 'Melt'],
  },
  {
    title: 'Tell Your World',
    stem: 'tell-your-world',
    aliases: ['Tell Your World'],
  },
  {
    title: '罗密欧与灰姑娘',
    stem: 'romeo-and-cinderella',
    aliases: ['ロミオとシンデレラ', '罗密欧与灰姑娘', 'Romeo and Cinderella', 'Romio and Cinderella'],
  },
  {
    title: '初音未来的消失',
    stem: 'disappearance-of-hatsune-miku',
    aliases: ['初音ミクの消失', '初音未来的消失', 'The Disappearance of Hatsune Miku'],
  },
  {
    title: '爱言叶',
    stem: 'ai-kotoba',
    aliases: ['愛言葉', '爱言叶', 'Ai Kotoba', 'Love Words'],
  },
  {
    title: '砂之惑星',
    stem: 'sand-planet',
    aliases: ['砂の惑星', '砂之惑星', 'Suna no Wakusei', 'DUNE', 'Sand Planet'],
  },
  {
    title: 'ODDS&ENDS',
    stem: 'odds-and-ends',
    aliases: ['ODDS&ENDS', 'ODDS AND ENDS', 'Odds Ends'],
  },
];

function usage() {
  console.log(`Usage: npm run import:music-assets -- --from <authorized-audio-dir> [--overwrite] [--dry-run]

Only import audio files you have the right to use.
Supported formats: ${allowedExtensions.join(', ')}
The script copies files into assets/audio/ using the filename stems expected by index.html.`);
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function normalize(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/feat\.?|ft\.?/g, '')
    .replace(/hatsune\s*miku|初音ミク|初音未来/g, '')
    .replace(/[()[\]{}【】「」『』（）.,，。!！?？'"]/g, '')
    .replace(/&/g, 'and')
    .replace(/[\s_-]+/g, '');
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function buildCatalog(sourceDir) {
  const catalog = new Map();
  for (const filePath of walk(sourceDir)) {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    if (!allowedExtensions.includes(ext)) continue;
    const stat = fs.statSync(filePath);
    if (stat.size <= 0) continue;
    const base = path.basename(filePath, path.extname(filePath));
    const key = normalize(base);
    if (!catalog.has(key)) catalog.set(key, []);
    catalog.get(key).push({ filePath, ext, size: stat.size });
  }
  return catalog;
}

function findSource(catalog, track) {
  const keys = [track.stem, ...track.aliases].map(normalize);
  const candidates = [];
  for (const key of keys) {
    const matches = catalog.get(key);
    if (matches) candidates.push(...matches);
  }
  candidates.sort((a, b) => allowedExtensions.indexOf(a.ext) - allowedExtensions.indexOf(b.ext));
  return candidates[0] || null;
}

const fromDir = getArgValue('--from');
const overwrite = process.argv.includes('--overwrite');
const dryRun = process.argv.includes('--dry-run');

if (process.argv.includes('--help') || !fromDir) {
  usage();
  process.exit(process.argv.includes('--help') ? 0 : 1);
}

const sourceDir = path.resolve(fromDir);
if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
  console.error(`FAIL source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

if (!dryRun) fs.mkdirSync(audioDir, { recursive: true });

const catalog = buildCatalog(sourceDir);
const missing = [];
const copied = [];
const skipped = [];

for (const track of tracks) {
  const source = findSource(catalog, track);
  if (!source) {
    missing.push(track.title);
    continue;
  }

  const dest = path.join(audioDir, `${track.stem}.${source.ext}`);
  if (fs.existsSync(dest) && !overwrite) {
    skipped.push(`${track.title}: ${path.relative(root, dest)} exists`);
    continue;
  }

  if (!dryRun) fs.copyFileSync(source.filePath, dest);
  copied.push(`${track.title}: ${path.relative(root, dest)} <= ${source.filePath}`);
}

for (const line of copied) console.log(`COPY ${line}`);
for (const line of skipped) console.log(`SKIP ${line}`);

if (missing.length > 0) {
  console.error(`FAIL missing source files for ${missing.length} track(s): ${missing.join(', ')}`);
  process.exit(1);
}

console.log(dryRun ? 'PASS dry run matched all expected tracks' : 'PASS imported all expected tracks');
