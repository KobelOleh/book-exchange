'use client';

import { useState } from 'react';

/** Round avatar; falls back to the name's initial when there is no usable photo. */
export function Avatar({
  url,
  name,
  size = 'md',
}: {
  url?: string | null;
  name: string;
  size?: 'md' | 'lg';
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const className = `avatar avatar--${size}`;

  if (!url || failedUrl === url) {
    return (
      <span className={className} aria-hidden="true">
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // Avatar URLs are user-supplied, so next/image remote patterns do not apply.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={url}
      alt=""
      onError={() => setFailedUrl(url)}
    />
  );
}
