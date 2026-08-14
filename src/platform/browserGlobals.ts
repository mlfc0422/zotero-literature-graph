type SandboxGlobalKey =
  | "window"
  | "document"
  | "navigator"
  | "console"
  | "HTMLElement"
  | "HTMLCanvasElement"
  | "CanvasRenderingContext2D"
  | "Image"
  | "getComputedStyle"
  | "requestAnimationFrame"
  | "cancelAnimationFrame";

/**
 * Cytoscape reads browser constructors both while importing and later while
 * creating/rendering a graph. Zotero's plugin sandbox does not expose those
 * constructors, so keep them bound to the long-lived main window for the
 * lifetime of the plugin. Never bind them to the closeable graph dialog.
 */
export function installBrowserGlobals(win: Window): void {
  const values: Record<SandboxGlobalKey, unknown> = {
    window: win,
    document: win.document,
    navigator: win.navigator,
    console: win.console,
    HTMLElement: win.HTMLElement,
    HTMLCanvasElement: win.HTMLCanvasElement,
    CanvasRenderingContext2D: win.CanvasRenderingContext2D,
    Image: win.Image,
    getComputedStyle: win.getComputedStyle.bind(win),
    requestAnimationFrame: win.requestAnimationFrame.bind(win),
    cancelAnimationFrame: win.cancelAnimationFrame.bind(win),
  };
  const sandbox = _globalThis as Record<string, unknown>;
  for (const [key, value] of Object.entries(values)) sandbox[key] = value;
}

export function getBrowserCrypto(): Crypto {
  const crypto = Zotero.getMainWindow()?.crypto;
  if (!crypto) throw new Error("Browser crypto is unavailable");
  return crypto;
}

export function encodeBrowserBase64(bytes: Uint8Array): string {
  const encode = Zotero.getMainWindow()?.btoa;
  if (!encode) throw new Error("Browser base64 encoder is unavailable");
  return encode(String.fromCharCode(...bytes));
}

export function decodeBrowserBase64(value: string): Uint8Array {
  const decode = Zotero.getMainWindow()?.atob;
  if (!decode) throw new Error("Browser base64 decoder is unavailable");
  return Uint8Array.from(decode(value), (character) => character.charCodeAt(0));
}
