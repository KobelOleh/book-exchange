/** Centred column used by the log in, register and password reset pages. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto grid w-full max-w-100 gap-6 px-4 py-12">
      <div className="grid gap-1">
        <h1>{title}</h1>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
      {children}
    </main>
  );
}

/** Small centred line under the form, e.g. a link to the other auth page. */
export const authFooterClass = 'text-center text-sm text-muted';
