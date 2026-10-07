import { FingerprintEnv, fingerprint, fingerprintSource, readFingerprintEnv, sha256Hex } from './fingerprint';

const env: FingerprintEnv = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
  language: 'pt-BR',
  platform: 'iPhone',
  screenWidth: 390,
  screenHeight: 844,
  colorDepth: 24,
  timeZone: 'America/Sao_Paulo',
  hardwareConcurrency: 6,
  deviceMemory: 4,
};

const HEX64 = /^[a-f0-9]{64}$/;

describe('fingerprint', () => {
  describe('fingerprintSource', () => {
    it('given the same browser data, when built twice, then the source is identical', () => {
      expect(fingerprintSource({ ...env })).toBe(fingerprintSource({ ...env }));
    });

    it('given different browser data, when built, then the source differs', () => {
      expect(fingerprintSource({ ...env, screenWidth: 430 })).not.toBe(fingerprintSource(env));
    });

    it('given no deviceMemory (Safari/Firefox), when built, then still produces a source with an empty slot', () => {
      const { deviceMemory: _, ...withoutMemory } = env;
      expect(fingerprintSource(withoutMemory)).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)|pt-BR|iPhone|390x844|24|America/Sao_Paulo|6|',
      );
    });
  });

  describe('sha256Hex', () => {
    it('given "abc", when hashed, then matches the SHA-256 test vector', async () => {
      expect(await sha256Hex('abc', crypto.subtle)).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      );
    });

    it('given a text, when hashed, then asks crypto.subtle for SHA-256', async () => {
      const digest = spyOn(crypto.subtle, 'digest').and.callThrough();
      await sha256Hex('x', crypto.subtle);
      expect(digest.calls.mostRecent().args[0]).toBe('SHA-256');
    });
  });

  describe('fingerprint()', () => {
    it('given the same environment, when computed twice, then returns the same 64-hex hash', async () => {
      const a = await fingerprint(() => env);
      expect(a).toMatch(HEX64);
      expect(await fingerprint(() => ({ ...env }))).toBe(a!);
    });

    it('given different environments, when computed, then the hashes differ', async () => {
      const other = await fingerprint(() => ({ ...env, timeZone: 'Europe/Lisbon' }));
      expect(other).not.toBe((await fingerprint(() => env))!);
    });

    it('given any environment, when computed, then never draws a random UUID', async () => {
      const uuid = spyOn(crypto, 'randomUUID').and.callThrough();
      await fingerprint(() => env);
      expect(uuid).not.toHaveBeenCalled();
    });

    it('given localStorage was cleared (or an incognito tab), when computed again, then the identity does not change', async () => {
      const before = await fingerprint();
      localStorage.clear();
      expect(await fingerprint()).toBe(before);
    });

    it('given the real browser, when its data is read, then the required fields come from navigator, screen and Intl', () => {
      const real = readFingerprintEnv();
      expect(real).not.toBeNull();
      expect(real!.userAgent).toBe(navigator.userAgent);
      expect(real!.screenWidth).toBe(screen.width);
      expect(real!.timeZone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    });

    it('given no browser data available (non-browser runtime), when computed, then returns null instead of throwing', async () => {
      expect(await fingerprint(() => null)).toBeNull();
    });

    it('given SHA-256 is unavailable (insecure context), when computed, then returns null instead of throwing', async () => {
      expect(await fingerprint(() => env, () => undefined)).toBeNull();
    });
  });
});
