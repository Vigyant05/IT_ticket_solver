'use client';

import { useEmployeeStore } from '@employees/store/employeeStore';
import { useEffect } from 'react';

export function ThemeController() {
  const { theme } = useEmployeeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
}
