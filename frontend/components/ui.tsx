export function Spinner() {
  return (
    <span
      className="inline-block size-[1em] animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[spin_3s_linear_infinite]"
      aria-hidden="true"
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-1">
        <h1>{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function ErrorAlert({ error }: { error: Error | null }) {
  if (!error) return null;
  return (
    <p
      className="rounded-sm bg-danger-soft p-3 text-sm text-danger"
      role="alert"
    >
      {error.message}
    </p>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2 rounded-md border border-dashed border-line-strong px-4 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {children && <p className="text-muted">{children}</p>}
    </div>
  );
}

/** Count shown next to a heading, e.g. "12 books". */
export function Count({
  children,
  ...rest
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span className="text-sm text-muted" {...rest}>
      {children}
    </span>
  );
}

/** A titled block of a page, with an optional count beside the title. */
export function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="grid content-start gap-4">
      <div className="flex items-baseline gap-2">
        <h2>{title}</h2>
        {count !== undefined && <Count>{count}</Count>}
      </div>
      {children}
    </section>
  );
}
