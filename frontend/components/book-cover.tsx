'use client';

import { useState } from 'react';

function PlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    </svg>
  );
}

/** Book photo with a fixed 2:3 frame; falls back to a placeholder of the same size. */
export function BookCover({
  url,
  title,
  showLabel = true,
}: {
  url?: string | null;
  title: string;
  showLabel?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) {
    return (
      <div
        className="cover cover--placeholder"
        role="img"
        aria-label={`No cover for ${title}`}
      >
        <PlaceholderIcon />
        {showLabel && <span>No cover</span>}
      </div>
    );
  }

  return (
    // Photo URLs are user-supplied, so next/image remote patterns do not apply.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="cover"
      src={url}
      alt={`Cover of ${title}`}
      loading="lazy"
      onError={() => setFailedUrl(url)}
    />
  );
}
