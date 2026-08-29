// @ts-nocheck
export class TranslationService {
  private map: Record<string, string> = {};
  private observer: MutationObserver | null = null;
  private isObserving = false;

  constructor() {
    this.loadMap();
  }

  loadMap() {
    if (typeof window === "undefined") return;
    try {
      this.map = JSON.parse(localStorage.getItem("custom_text_map") || "{}");
    } catch (e) {
      console.warn("Failed to load translation map:", e);
    }
  }

  saveMap(newMap: Record<string, string>) {
    this.map = { ...this.map, ...newMap };
    if (typeof window !== "undefined") {
      localStorage.setItem("custom_text_map", JSON.stringify(this.map));
    }
  }

  getMap() {
    return this.map;
  }

  applyToDOM(root: Node) {
    if (typeof document === "undefined") return;
    if (Object.keys(this.map).length === 0) return;

    if (root.nodeType === Node.TEXT_NODE) {
      const text = root.nodeValue;
      if (text) {
        const trimmed = text.trim();
        if (trimmed && this.map[trimmed] && trimmed !== this.map[trimmed]) {
          root.nodeValue = text.replace(trimmed, this.map[trimmed]);
        }
      }
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      const el = root as HTMLElement;
      if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "NOSCRIPT") return;

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const nodesToReplace: { node: Node; oldStr: string; newStr: string }[] = [];

      while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        if (text) {
          const trimmed = text.trim();
          if (trimmed && this.map[trimmed] && trimmed !== this.map[trimmed]) {
            nodesToReplace.push({ node, oldStr: trimmed, newStr: this.map[trimmed] });
          }
        }
      }

      nodesToReplace.forEach(({ node, oldStr, newStr }) => {
        if (node.nodeValue) {
          node.nodeValue = node.nodeValue.replace(oldStr, newStr);
        }
      });
    }
  }

  start() {
    if (typeof window === "undefined" || this.isObserving) return;
    if (Object.keys(this.map).length === 0) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "childList") {
          m.addedNodes.forEach((node) => {
            this.applyToDOM(node);
          });
        } else if (m.type === "characterData") {
          this.applyToDOM(m.target);
        }
      });
    });

    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    this.applyToDOM(document.body);
    this.isObserving = true;
  }
}

export const translator = new TranslationService();
