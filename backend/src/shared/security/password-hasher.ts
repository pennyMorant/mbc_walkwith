import {
  type ScryptOptions,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from "node:crypto";

const keyLength = 64;
const scryptParams = {
  N: 16_384,
  r: 8,
  p: 1
};

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, scryptParams);
  return [
    "scrypt",
    "v1",
    `n=${scryptParams.N}`,
    `r=${scryptParams.r}`,
    `p=${scryptParams.p}`,
    salt.toString("base64url"),
    hash.toString("base64url")
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encodedHash: string
): Promise<boolean> {
  const parsed = parsePasswordHash(encodedHash);
  if (!parsed) {
    return false;
  }

  const candidate = await scrypt(password, parsed.salt, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p
  });

  return (
    candidate.length === parsed.hash.length &&
    timingSafeEqual(candidate, parsed.hash)
  );
}

function scrypt(
  password: string,
  salt: Buffer,
  options: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

function parsePasswordHash(encodedHash: string):
  | {
      N: number;
      r: number;
      p: number;
      salt: Buffer;
      hash: Buffer;
    }
  | null {
  const [algorithm, version, nValue, rValue, pValue, salt, hash] =
    encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    version !== "v1" ||
    !nValue ||
    !rValue ||
    !pValue ||
    !salt ||
    !hash
  ) {
    return null;
  }

  const N = numberParam(nValue, "n");
  const r = numberParam(rValue, "r");
  const p = numberParam(pValue, "p");
  if (!N || !r || !p) {
    return null;
  }

  return {
    N,
    r,
    p,
    salt: Buffer.from(salt, "base64url"),
    hash: Buffer.from(hash, "base64url")
  };
}

function numberParam(value: string, key: string): number | null {
  const prefix = `${key}=`;
  if (!value.startsWith(prefix)) {
    return null;
  }
  const parsed = Number.parseInt(value.slice(prefix.length), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
