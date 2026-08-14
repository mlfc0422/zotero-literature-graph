import {
  decodeBrowserBase64,
  encodeBrowserBase64,
  getBrowserCrypto,
} from "./browserGlobals";

export function base64Encode(bytes: Uint8Array): string {
  return encodeBrowserBase64(bytes);
}

export async function aesEcbEncrypt(
  message: string,
  secret: string,
): Promise<Uint8Array> {
  const crypto = getBrowserCrypto();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "AES-CBC" },
    false,
    ["encrypt"],
  );
  const encoded = new TextEncoder().encode(message);
  const blocks: Uint8Array[] = [];
  for (let offset = 0; offset < encoded.length; offset += 16)
    blocks.push(encoded.subarray(offset, offset + 16));
  if (!blocks.length || blocks.at(-1)?.length === 16) blocks.push(pkcs7Pad([]));
  else blocks[blocks.length - 1] = pkcs7Pad(blocks.at(-1)!);
  const zeros = new Uint8Array(16);
  const encrypted = new Uint8Array(blocks.length * 16);
  for (let index = 0; index < blocks.length; index++) {
    const result = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: blocks[index] },
      key,
      zeros,
    );
    encrypted.set(new Uint8Array(result).subarray(0, 16), index * 16);
  }
  return encrypted;
}

export async function aesEcbDecrypt(
  message: string,
  secret: string,
): Promise<string> {
  const crypto = getBrowserCrypto();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "AES-CBC" },
    false,
    ["encrypt", "decrypt"],
  );
  const bytes = decodeBrowserBase64(message);
  const zeros = new Uint8Array(16);
  const decrypted = new Uint8Array(bytes.length);
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const block = bytes.subarray(offset, offset + 16);
    const padding = new Uint8Array(16).fill(16);
    const paddingIv = block.map((value, index) => value ^ padding[index]);
    const paddingCipher = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-CBC", iv: paddingIv },
        key,
        zeros,
      ),
    ).subarray(0, 16);
    const result = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: zeros },
      key,
      new Uint8Array([...block, ...paddingCipher]),
    );
    decrypted.set(new Uint8Array(result), offset);
  }
  return new TextDecoder().decode(pkcs7Unpad(decrypted));
}

function pkcs7Pad(block: Uint8Array | number[]): Uint8Array {
  const padding = 16 - block.length;
  return new Uint8Array([...block, ...new Array(padding).fill(padding)]);
}

function pkcs7Unpad(block: Uint8Array): Uint8Array {
  const padding = block.at(-1) ?? 0;
  if (padding < 1 || padding > 16) throw new Error("Invalid PKCS7 padding");
  return block.subarray(0, block.length - padding);
}
