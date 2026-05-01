'use client';

import { useUserStore } from '@user/store/userStore';
import { useEffect } from 'react';

export function ThemeController() {
  const { theme } = useUserStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
