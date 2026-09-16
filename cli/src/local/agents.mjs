import { createHash } from 'node:crypto';

// Mirrors FlambeNext.Agents (ADR-012): keep the roster and picking rule in sync.
const NAMES = [
  'Steve', 'Belinda', 'Juniper', 'Marcel', 'Priya', 'Otis', 'Nia', 'Theo', 'Carmen', 'Felix', 'Imani', 'Rory', 'Greta', 'Miles', 'Suki',
  'Anouk', 'Bastian', 'Cleo', 'Dashiell', 'Esme', 'Fitz', 'Hollis', 'Ines', 'Jasper', 'Kenji', 'Lucia', 'Mattias', 'Noor', 'Oona',
  'Pilar', 'Quill', 'Ravi', 'Sable', 'Tamsin', 'Ulla', 'Vera', 'Wren', 'Xiomara', 'Yusuf', 'Zadie',
];

export function usableName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed !== '' && Buffer.byteLength(trimmed) <= 100
    && !trimmed.includes('\n') && !trimmed.includes('\r');
}

/** A name for `agentId` that none of `taken` uses; deterministic for the id. */
export function pickName(agentId, taken = []) {
  const lower = new Set(taken.map(name => name.toLowerCase()));
  const offset = createHash('sha256').update(agentId).digest().readUInt16BE(0);
  for (let index = 0; index < NAMES.length; index += 1) {
    const candidate = NAMES[(offset + index) % NAMES.length];
    if (!lower.has(candidate.toLowerCase())) return candidate;
  }
  const base = NAMES[offset % NAMES.length];
  for (let n = 2; ; n += 1) {
    const candidate = `${base} ${n}`;
    if (!lower.has(candidate.toLowerCase())) return candidate;
  }
}
