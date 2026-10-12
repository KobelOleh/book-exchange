'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

function PlaceholderIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
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

/**
 * Book photo in a fixed 2:3 frame; falls back to a placeholder of the same size.
 * The photo fills the frame instead of sizing it, because a broken <img> loses
 * its aspect ratio and would shrink for a moment before the placeholder appears.
 */
export function BookCover({
  url,
  title,
  showLabel = true,
  className,
}: {
  url?: string | null;
  title: string;
  /** Large covers say "No cover"; compact ones (book rows) show just the icon. */
  showLabel?: boolean;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const frame = cn(
    'relative block aspect-[2/3] w-full overflow-hidden rounded-sm bg-subtle',
    className,
  );

  if (!url || failedUrl === url) {
    return (
      <div
        className={cn(
          frame,
          'flex flex-col items-center justify-center gap-2 border border-line-strong text-xs text-muted',
          showLabel && 'border-dashed',
        )}
        role="img"
        aria-label={`No cover for ${title}`}
      >
        <PlaceholderIcon className={showLabel ? 'size-8' : 'size-5'} />
        {showLabel && <span>No cover</span>}
      </div>
    );
  }

  return (
    <div className={frame}>
      {/* Photo URLs are user-supplied, so next/image remote patterns do not apply. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="absolute inset-0 size-full object-cover"
        src={url}
        alt=""
        loading="lazy"
        onError={() => setFailedUrl(url)}
      />
    </div>
  );
}
