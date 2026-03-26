'use client';

import { useEffect } from 'react';

export function PortalPwa() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // The portal stays fully functional even without offline shell caching.
    });
  }, []);

  return null;
}
