import { useEffect, useState } from 'react';

/** The element's live distance from the top of the document: the window virtualizer's `scrollMargin`. */
export function useDocumentOffsetTop(element: HTMLElement | null): number {
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = () => setOffsetTop(element.getBoundingClientRect().top + window.scrollY);
    // Layout changes above the element resize the body; also fires once on observe.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [element]);

  return offsetTop;
}
