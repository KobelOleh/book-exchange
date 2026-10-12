'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';

export const ME_KEY = ['me'];

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api<User>('/auth/me'),
    retry: false,
  });
}
