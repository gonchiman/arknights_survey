import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '..');
const voiceLinesPath = resolve(
  repositoryRoot,
  'arknights_voice_text_viewer/data/processed/voice_lines.json'
);
const operatorsPath = resolve(
  repositoryRoot,
  'arknights_damage_calculator/data/processed/operators.json'
);
const outputPath = resolve(projectRoot, 'assets/data/voice_catalog.json');
const raritiesOutputPath = resolve(projectRoot, 'assets/data/operator_rarities.json');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function requireString(value, field, recordId) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${recordId}: ${field} must be a non-empty string`);
  }

  return value;
}

function parseRarity(value, operatorId) {
  const match = typeof value === 'string' ? /^TIER_([1-6])$/.exec(value) : null;

  if (!match) {
    throw new Error(`${operatorId}: rarity must be TIER_1 through TIER_6`);
  }

  return Number(match[1]);
}

function buildCatalog(voiceLines, operators) {
  if (!Array.isArray(voiceLines)) {
    throw new Error('voice_lines.json must contain an array');
  }

  if (!Array.isArray(operators)) {
    throw new Error('operators.json must contain an array');
  }

  const operatorMetadata = new Map(
    operators
      .filter((operator) => typeof operator.id === 'string' && typeof operator.name === 'string')
      .map((operator) => [
        operator.id,
        {
          name: operator.name,
          rarity: parseRarity(operator.rarity, operator.id),
        },
      ])
  );
  const groupedVoices = new Map();
  const voiceIds = new Set();

  for (const source of voiceLines) {
    const id = requireString(source.charWordId, 'charWordId', 'voice line');
    const operatorId = requireString(source.charId, 'charId', id);

    if (voiceIds.has(id)) {
      throw new Error(`Duplicate voice line id: ${id}`);
    }
    voiceIds.add(id);

    const voice = {
      id,
      variantId: requireString(source.wordKey, 'wordKey', id),
      voiceId: typeof source.voiceId === 'string' ? source.voiceId : '',
      title: typeof source.voiceTitle === 'string' ? source.voiceTitle : '',
      text: requireString(source.voiceText, 'voiceText', id),
      index: Number.isFinite(source.voiceIndex) ? source.voiceIndex : 0,
      assetPath: typeof source.voiceAsset === 'string' ? source.voiceAsset : '',
    };

    const voices = groupedVoices.get(operatorId) ?? [];
    voices.push(voice);
    groupedVoices.set(operatorId, voices);
  }

  const missingOperatorNames = [];
  const operatorRarities = {};
  const catalogOperators = [...groupedVoices.entries()].map(([id, voices]) => {
    const metadata = operatorMetadata.get(id);
    if (!metadata) {
      missingOperatorNames.push(id);
    } else {
      operatorRarities[id] = metadata.rarity;
    }

    voices.sort((left, right) => left.index - right.index || left.id.localeCompare(right.id));

    return {
      id,
      name: metadata?.name ?? id,
      voices,
    };
  });

  catalogOperators.sort(
    (left, right) => left.name.localeCompare(right.name, 'ja') || left.id.localeCompare(right.id)
  );

  return {
    catalog: {
      operatorCount: catalogOperators.length,
      voiceCount: voiceLines.length,
      operators: catalogOperators,
    },
    operatorRarities,
    missingOperatorNames,
  };
}

async function main() {
  const [voiceLines, operators] = await Promise.all([
    readJson(voiceLinesPath),
    readJson(operatorsPath),
  ]);
  const { catalog, operatorRarities, missingOperatorNames } = buildCatalog(voiceLines, operators);

  await mkdir(dirname(outputPath), { recursive: true });
  await Promise.all([
    writeFile(outputPath, `${JSON.stringify(catalog)}\n`, 'utf8'),
    writeFile(raritiesOutputPath, `${JSON.stringify(operatorRarities)}\n`, 'utf8'),
  ]);

  console.log(`${catalog.operatorCount} operators written to ${outputPath}`);
  console.log(`${Object.keys(operatorRarities).length} rarities written to ${raritiesOutputPath}`);
  console.log(`${catalog.voiceCount} voice lines included`);
  console.log(`${missingOperatorNames.length} operator names missing`);

  if (missingOperatorNames.length > 0) {
    console.log(missingOperatorNames.join('\n'));
    process.exitCode = 1;
  }
}

await main();
