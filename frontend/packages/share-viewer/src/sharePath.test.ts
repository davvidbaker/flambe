import { shareIdFromPath } from './sharePath';

describe('shareIdFromPath', () => {
  it('reads the id from /s/:id', () => {
    expect(shareIdFromPath('/s/2LWZGAWPQFTMBRPJlR2Xzw')).toBe('2LWZGAWPQFTMBRPJlR2Xzw');
  });

  it('returns null for other paths', () => {
    expect(shareIdFromPath('/')).toBeNull();
    expect(shareIdFromPath('/s/')).toBeNull();
  });
});
