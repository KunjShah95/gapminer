import { useEffect } from "react";

type KeyMap = Record<string, () => void>;

function isEditable(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

export function useHotkeys(map: KeyMap): void {
  useEffect(() => {
    const buffer: string[] = [];
    let timeout: ReturnType<typeof setTimeout> | null = null;

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();

      if (isEditable(e.target)) return;

      if (map[key]) {
        e.preventDefault();
        map[key]();
        buffer.length = 0;
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        return;
      }

      if (key.length === 1 && key >= "a" && key <= "z") {
        buffer.push(key);
        const seq = buffer.join("+");

        if (map[seq]) {
          e.preventDefault();
          map[seq]();
          buffer.length = 0;
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          return;
        }

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer.length = 0;
        }, 1000);
      } else {
        buffer.length = 0;
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timeout) clearTimeout(timeout);
    };
  }, [map]);
}
