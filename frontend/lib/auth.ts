'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { Profile, User } from './types';

export const ME_KEY = ['me'];

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api<User>('/auth/me'),
    retry: false,
  });
}

export const PROFILE_KEY = ['profile'];

export function useProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => api<Profile>('/auth/me'),
  });
}
