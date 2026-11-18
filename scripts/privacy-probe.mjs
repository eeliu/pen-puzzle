import { readFile } from 'node:fs/promises';

const approvedExternalHosts = new Set([
  'fonts.googleapis.com',
  'github.com',
  'www.googletagmanager.com',
]);

const approvedLocalStorageKeys = new Set([
  'pen-puzzle-language',
  'pen-puzzle-progress',
]);

const approvedIndexedDbNames = new Set([
  'pen-puzzle-history',
]);

const resourceFiles = ['index.html', 'styles.css'];
const applicationFile = 'app.js';
const failures = [];

for (const fileName of resourceFiles) {
  const source = await readFile(fileName, 'utf8');
  const externalUrls = source.match(/https:\/\/[^\s"'`)]+/g) ?? [];

  for (const externalUrl of externalUrls) {
    let host;

    try {
      host = new URL(externalUrl).hostname;
    } catch {
      failures.push(`${fileName}: invalid external URL ${externalUrl}`);
      continue;
    }

    if (!approvedExternalHosts.has(host)) {
      failures.push(`${fileName}: unapproved external host ${host}`);
    }
  }
}

const applicationSource = await readFile(applicationFile, 'utf8');
const networkApiPatterns = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bsendBeacon\s*\(/,
  /\bWebSocket\s*\(/,
  /\bEventSource\s*\(/,
  /document\.cookie\b/,
];

for (const pattern of networkApiPatterns) {
  if (pattern.test(applicationSource)) {
    failures.push(`${applicationFile}: found network or cookie API ${pattern}`);
  }
}

const stringConstants = new Map();
for (const match of applicationSource.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g)) {
  stringConstants.set(match[1], match[2]);
}

const usedLocalStorageKeys = new Set();
for (const match of applicationSource.matchAll(/localStorage\.(?:getItem|setItem)\(\s*([^,)]+)/g)) {
  const argument = match[1].trim();
  const literalMatch = argument.match(/^['"]([^'"]+)['"]$/);
  const key = literalMatch?.[1] ?? stringConstants.get(argument);

  if (key) {
    usedLocalStorageKeys.add(key);
  } else {
    failures.push(`${applicationFile}: could not resolve localStorage key ${argument}`);
  }
}

for (const key of usedLocalStorageKeys) {
  if (!approvedLocalStorageKeys.has(key)) {
    failures.push(`${applicationFile}: unapproved localStorage key ${key}`);
  }
}

const usedIndexedDbNames = new Set();
for (const match of applicationSource.matchAll(/indexedDB\.open\(\s*([A-Za-z_$][\w$]*)/g)) {
  const constantName = match[1];
  const databaseName = stringConstants.get(constantName);

  if (databaseName) {
    usedIndexedDbNames.add(databaseName);
  } else {
    failures.push(`${applicationFile}: could not resolve IndexedDB name ${constantName}`);
  }
}

for (const name of usedIndexedDbNames) {
  if (!approvedIndexedDbNames.has(name)) {
    failures.push(`${applicationFile}: unapproved IndexedDB database ${name}`);
  }
}

if (failures.length > 0) {
  console.error('Privacy probe failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log('Privacy probe passed.');
  console.log(`Approved external hosts: ${[...approvedExternalHosts].join(', ')}`);
  console.log(`localStorage keys: ${[...usedLocalStorageKeys].join(', ') || 'none'}`);
  console.log(`IndexedDB databases: ${[...usedIndexedDbNames].join(', ') || 'none'}`);
}
