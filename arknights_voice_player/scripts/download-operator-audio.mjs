import { Buffer } from 'node:buffer';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const catalogPath = path.join(projectRoot, 'assets', 'data', 'voice_catalog.json');
const raritiesPath = path.join(projectRoot, 'assets', 'data', 'operator_rarities.json');
const outputRoot = path.join(projectRoot, 'public', 'audio', 'voice_en');
const upstreamBaseUrl =
  'https://raw.githubusercontent.com/PseudoMon/arknights-audio/global-server-voices/voice_en';
const concurrency = 6;

function printUsage() {
  console.log('Usage: npm.cmd run download:operator-audio -- <operator name or ID>');
  console.log('Example: npm.cmd run download:operator-audio -- エクシア');
  console.log('Example: npm.cmd run download:operator-audio -- char_103_angel');
  console.log('Usage: npm.cmd run download:rarity-audio -- <rarity>');
  console.log('Example: npm.cmd run download:rarity-audio -- 6');
  console.log('Add --dry-run to show the target count without downloading files.');
}

const args = process.argv.slice(2);
const dryRunIndex = args.indexOf('--dry-run');
const dryRun = dryRunIndex !== -1;

if (dryRun) {
  args.splice(dryRunIndex, 1);
}

const query = args.join(' ').trim();

if (!query || query === '--help' || query === '-h') {
  printUsage();
  process.exitCode = query ? 0 : 1;
} else {
  try {
    if (args[0] === '--rarity') {
      if (args.length !== 2) {
        throw new Error('レアリティを1つ指定してください。例: --rarity 6');
      }

      await downloadRarityAudio(args[1], dryRun);
    } else {
      await downloadOperatorAudio(query, dryRun);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function downloadOperatorAudio(operatorQuery, isDryRun) {
  const catalog = await readJson(catalogPath);
  const operator = resolveOperator(catalog.operators, operatorQuery);
  const assetPaths = getUniqueAssetPaths([operator]);

  await downloadAssets(`${operator.name} (${operator.id})`, assetPaths, isDryRun);
}

async function downloadRarityAudio(rarityValue, isDryRun) {
  const rarity = Number(rarityValue);

  if (!Number.isInteger(rarity) || rarity < 1 || rarity > 6) {
    throw new Error('レアリティは1から6の整数で指定してください。');
  }

  const [catalog, operatorRarities] = await Promise.all([
    readJson(catalogPath),
    readJson(raritiesPath),
  ]);
  const operators = catalog.operators.filter(
    (operator) => operatorRarities[operator.id] === rarity
  );

  if (operators.length === 0) {
    throw new Error(`星${rarity}のボイス対象オペレーターが見つかりません。`);
  }

  const assetPaths = getUniqueAssetPaths(operators);
  await downloadAssets(
    `星${rarity}オペレーター${operators.length}人`,
    assetPaths,
    isDryRun
  );
}

function getUniqueAssetPaths(operators) {
  return [
    ...new Set(
      operators.flatMap((operator) =>
        operator.voices
          .map((voice) => voice.assetPath)
          .filter((assetPath) => typeof assetPath === 'string' && assetPath.length > 0)
      )
    ),
  ].sort();
}

async function downloadAssets(label, assetPaths, isDryRun) {
  console.log(`${label}: ${assetPaths.length}件を確認します。`);

  if (isDryRun) {
    console.log('dry-runのため、音声はダウンロードしません。');
    return;
  }

  const results = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < assetPaths.length) {
      const assetPath = assetPaths[nextIndex];
      nextIndex += 1;

      try {
        results.push(await downloadAsset(assetPath));
      } catch (error) {
        results.push({
          assetPath,
          status: 'failed',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await writeManifest();

  const downloadedCount = countResults(results, 'downloaded');
  const existingCount = countResults(results, 'existing');
  const unavailableResults = results.filter((result) => result.status === 'unavailable');
  const failedResults = results.filter((result) => result.status === 'failed');

  console.log(
    `音声の準備完了: ${downloadedCount}件をダウンロード、${existingCount}件は保存済み、${unavailableResults.length}件は配布元にありません。`
  );

  if (unavailableResults.length > 0) {
    console.log(
      `未配布: ${unavailableResults.map((result) => result.assetPath).sort().join(', ')}`
    );
  }

  if (failedResults.length > 0) {
    for (const result of failedResults.sort((left, right) =>
      left.assetPath.localeCompare(right.assetPath)
    )) {
      console.error(`${result.assetPath}: ${result.message}`);
    }

    process.exitCode = 1;
  }
}

function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase();
}

function resolveOperator(operators, query) {
  const normalizedQuery = normalize(query);
  const exactMatches = operators.filter(
    (operator) =>
      normalize(operator.id) === normalizedQuery || normalize(operator.name) === normalizedQuery
  );

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  const partialMatches = operators.filter(
    (operator) =>
      normalize(operator.id).includes(normalizedQuery) ||
      normalize(operator.name).includes(normalizedQuery)
  );

  if (partialMatches.length === 1) {
    return partialMatches[0];
  }

  if (partialMatches.length === 0) {
    throw new Error(
      `「${query}」に一致するオペレーターが見つかりません。ボイス一覧に表示される名前またはIDを指定してください。`
    );
  }

  const candidates = partialMatches
    .slice(0, 20)
    .map((operator) => `${operator.name} (${operator.id})`)
    .join('\n  ');
  const remainingCount = Math.max(partialMatches.length - 20, 0);
  const remainingMessage = remainingCount > 0 ? `\n  ほか${remainingCount}件` : '';

  throw new Error(
    `「${query}」には複数の候補があります。名前またはIDを詳しく指定してください。\n  ${candidates}${remainingMessage}`
  );
}

function getOutputPath(assetPath) {
  const parts = assetPath.split('/');

  if (parts.length !== 2 || parts.some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid voice asset path: ${assetPath}`);
  }

  return path.join(outputRoot, parts[0], `${parts[1]}.mp3`);
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
    return { assetPath, status: 'existing' };
  }

  const encodedAssetPath = assetPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(`${upstreamBaseUrl}/${encodedAssetPath}.mp3`);

  if (response.status === 404) {
    return { assetPath, status: 'unavailable' };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const audio = Buffer.from(await response.arrayBuffer());

  if (audio.length === 0) {
    throw new Error('Downloaded file was empty.');
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, audio);

  return { assetPath, status: 'downloaded' };
}

function countResults(results, status) {
  return results.filter((result) => result.status === status).length;
}

async function collectStoredAssetPaths(directory = outputRoot) {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const assetPaths = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      assetPaths.push(...(await collectStoredAssetPaths(entryPath)));
      continue;
    }

    if (!entry.isFile() || path.extname(entry.name).toLocaleLowerCase() !== '.mp3') {
      continue;
    }

    const relativePath = path.relative(outputRoot, entryPath);
    assetPaths.push(relativePath.slice(0, -path.extname(relativePath).length).split(path.sep).join('/'));
  }

  return assetPaths;
}

async function writeManifest() {
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    assetPaths: (await collectStoredAssetPaths()).sort(),
  };

  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
