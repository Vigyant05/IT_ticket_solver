'use client';

import { useTicketStore } from '@admin/store/ticketStore';
import { useEffect } from 'react';

export function ThemeController() {
  const { theme } = useTicketStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
