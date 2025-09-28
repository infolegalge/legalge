'use client';

export default function SessionDebug() {
  if (process.env.NEXT_PUBLIC_SHOW_PROFILE_DEBUG !== 'true') return null;
  return null;
}
