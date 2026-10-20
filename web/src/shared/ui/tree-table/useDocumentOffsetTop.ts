import { useEffect, useState } from 'react';

/**
 * The element's distance from the top of the document, kept current as the
 * page above it changes height. TanStack Virtual's window virtualizer needs it
 * as `scrollMargin` when the list doesn't start at the top of the page.
 */
export function useDocumentOffsetTop(element: HTMLElement | null): number {
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = () => setOffsetTop(element.getBoundingClientRect().top + window.scrollY);
    // Any layout change above the element changes the document's height; this also fires once on observe.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [element]);

  return offsetTop;
}
