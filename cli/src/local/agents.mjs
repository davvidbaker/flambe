import { createHash } from 'node:crypto';

const NAMES = [
  'Steve', 'Belinda', 'Juniper', 'Marcel', 'Priya', 'Otis', 'Nia', 'Theo',
  'Carmen', 'Felix', 'Imani', 'Rory', 'Greta', 'Miles', 'Suki',
];

export function agentDisplayName(instanceId, providedName, tokenName) {
  if (usableName(providedName)) return providedName.trim();
  if (usableName(tokenName)) return tokenName.trim();
  return nameFor(instanceId);
}

function usableName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed !== '' && Buffer.byteLength(trimmed) <= 100
    && !trimmed.includes('\n') && !trimmed.includes('\r');
}

function nameFor(instanceId) {
  const first = createHash('sha256').update(instanceId).digest()[0];
  return NAMES[first % NAMES.length];
}
