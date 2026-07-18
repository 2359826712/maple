import { DOMParser as LinkedomDOMParser, HTMLElement } from 'linkedom';

class ServerDOMParser {
  parseFromString(markup: string, mimeType: DOMParserSupportedType) {
    const source = mimeType === 'text/html' && !/<html(?:\s|>)/i.test(markup)
      ? `<!doctype html><html><head></head><body>${markup}</body></html>`
      : markup;
    return new LinkedomDOMParser().parseFromString(source, mimeType as 'text/html');
  }
}

export function ensureServerDom() {
  if (typeof globalThis.DOMParser === 'undefined') {
    Object.defineProperty(globalThis, 'DOMParser', { configurable: true, value: ServerDOMParser });
  }
  if (typeof globalThis.HTMLElement === 'undefined') {
    Object.defineProperty(globalThis, 'HTMLElement', { configurable: true, value: HTMLElement });
  }
}
