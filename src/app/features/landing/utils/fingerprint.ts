/**
 * Fingerprint DETERMINÍSTICO do navegador, só para o limite diário de impressão (IP + fingerprint).
 *
 * Usa apenas dados simples que o navegador já expõe — nada de canvas, WebGL, áudio ou fontes
 * instaladas. Por isso é grosseiro de propósito: aparelhos iguais (mesmo modelo de celular, mesma
 * versão, mesmo idioma e fuso) dão o mesmo valor. Quem separa essas pessoas é o IP, que entra junto
 * na chave do limite lá na API.
 *
 * Não é segurança: é calculado aqui e enviado pelo cliente, então dá para forjar. Serve para que
 * limpar o navegador ou abrir uma aba anônima não zere o limite de quem não está tentando burlar.
 *
 * Sem cache em localStorage, de propósito: o cálculo custa ~1ms e recalcular sempre garante que a
 * aba normal e a anônima cheguem ao MESMO valor — um cache antigo (de antes de o navegador se
 * atualizar, por exemplo) faria as duas divergirem.
 */
export interface FingerprintEnv {
  userAgent: string;
  language: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  timeZone: string;
  hardwareConcurrency: number;
  /** Só Chromium expõe; Safari e Firefox não. */
  deviceMemory?: number;
}

/** Ordem fixa e separador fixo: a mesma entrada sempre vira o mesmo texto. */
export function fingerprintSource(env: FingerprintEnv): string {
  return [
    env.userAgent,
    env.language,
    env.platform,
    `${env.screenWidth}x${env.screenHeight}`,
    env.colorDepth,
    env.timeZone,
    env.hardwareConcurrency,
    env.deviceMemory ?? '',
  ].join('|');
}

/** Lê os dados no navegador. Fora dele (SSR, testes em Node) devolve `null` em vez de quebrar. */
export function readFingerprintEnv(): FingerprintEnv | null {
  if (typeof navigator === 'undefined' || typeof screen === 'undefined') return null;
  try {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      // `platform` está deprecado, mas segue disponível em todos os navegadores.
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
      deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    };
  } catch {
    return null;
  }
}

export async function sha256Hex(text: string, subtle: SubtleCrypto): Promise<string> {
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

/** `crypto.subtle` só existe em contexto seguro (https ou localhost). */
const browserSubtle = (): SubtleCrypto | undefined =>
  typeof crypto !== 'undefined' ? crypto.subtle : undefined;

/**
 * SHA-256 (hex, 64 caracteres) dos dados do navegador, ou `null` se não der para calcular —
 * sem SHA-256 disponível ou fora do navegador. Com `null` a impressão segue normal e a API usa só o IP.
 */
export async function fingerprint(
  readEnv: () => FingerprintEnv | null = readFingerprintEnv,
  getSubtle: () => SubtleCrypto | undefined = browserSubtle,
): Promise<string | null> {
  const env = readEnv();
  const subtle = getSubtle();
  if (!env || !subtle) return null;
  try {
    return await sha256Hex(fingerprintSource(env), subtle);
  } catch {
    return null;
  }
}
