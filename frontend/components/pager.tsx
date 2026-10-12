import { Button } from './button';

/** Page numbers to show: the ends and the neighbours of the current page, with gaps between. */
function pageItems(current: number, total: number): (number | 'gap')[] {
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: (number | 'gap')[] = [];
  pages.forEach((page, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && page - previous === 2)
      items.push(previous + 1);
    else if (previous !== undefined && page - previous > 2) items.push('gap');
    items.push(page);
  });
  return items;
}

/**
 * Prev / numbers / Next. With a single page it renders nothing visible but
 * keeps its height, so the page below does not jump when the page count changes.
 */
export function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return <div className="min-h-8" aria-hidden="true" />;

  return (
    <nav
      className="flex min-h-8 flex-wrap items-center justify-center gap-3"
      aria-label="Pagination"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ‹ Prev
      </Button>
      <ol className="flex items-center gap-1">
        {pageItems(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li
              key={`gap-${index}`}
              className="px-1 text-muted"
              aria-hidden="true"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className="h-8 min-w-8 cursor-pointer rounded-sm border border-transparent px-2 tabular-nums hover:bg-subtle aria-[current=page]:cursor-default aria-[current=page]:border-accent aria-[current=page]:bg-accent aria-[current=page]:text-accent-ink"
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            </li>
          ),
        )}
      </ol>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next ›
      </Button>
      <span className="basis-full text-center text-xs text-muted md:basis-auto">
        Page {page} of {totalPages}
      </span>
    </nav>
  );
}
