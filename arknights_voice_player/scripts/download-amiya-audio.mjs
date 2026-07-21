import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const catalogPath = path.join(projectRoot, 'assets', 'data', 'voice_catalog.json');
const outputRoot = path.join(projectRoot, 'public', 'audio', 'voice_en');
const upstreamBaseUrl =
  'https://raw.githubusercontent.com/PseudoMon/arknights-audio/global-server-voices/voice_en';
const unavailableAssetPaths = new Set([
  'char_002_amiya/CN_043',
  'char_1001_amiya2/CN_043',
  'char_1037_amiya3/CN_043',
]);
const concurrency = 6;

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const amiya = catalog.operators.find((operator) => operator.id === 'char_002_amiya');

if (!amiya) {
  throw new Error('Amiya was not found in voice_catalog.json.');
}

const assetPaths = [
  ...new Set(
    amiya.voices
      .map((voice) => voice.assetPath)
      .filter((assetPath) => !unavailableAssetPaths.has(assetPath))
  ),
].sort();

function getOutputPath(assetPath) {
  const [variantId, voiceId, ...unexpectedParts] = assetPath.split('/');

  if (!variantId || !voiceId || unexpectedParts.length > 0) {
    throw new Error(`Invalid voice asset path: ${assetPath}`);
  }

  return path.join(outputRoot, variantId, `${voiceId}.mp3`);
}

async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function downloadAsset(assetPath) {
  const outputPath = getOutputPath(assetPath);

  if (await fileExists(outputPath)) {
    return { assetPath, downloaded: false };
  }

  const encodedAssetPath = assetPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${upstreamBaseUrl}/${encodedAssetPath}.mp3`);

  if (!response.ok) {
    throw new Error(`Failed to download ${assetPath}: HTTP ${response.status}`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

  return { assetPath, downloaded: true };
}

const results = [];
let nextIndex = 0;

async function worker() {
  while (nextIndex < assetPaths.length) {
    const assetPath = assetPaths[nextIndex];
    nextIndex += 1;
    results.push(await downloadAsset(assetPath));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

const completedAssetPaths = results.map((result) => result.assetPath).sort();
const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  assetPaths: completedAssetPaths,
};

await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const downloadedCount = results.filter((result) => result.downloaded).length;
const existingCount = results.length - downloadedCount;

console.log(
  `Amiya audio ready: ${results.length} files (${downloadedCount} downloaded, ${existingCount} already present).`
);
console.log(`Not available from the source repository: ${unavailableAssetPaths.size} files.`);
