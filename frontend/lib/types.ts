export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;
}

export interface Profile extends User {
  booksCount: number;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  photoUrl: string;
  ownerId: string;
  createdAt: string;
  owner: { id: string; name: string };
}

export interface ExchangeBook {
  id: string;
  name: string;
  author: string;
  photoUrl: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface ExchangeRequest {
  id: string;
  createdAt: string;
  requester: Person;
  requestedBook: ExchangeBook & { owner: Omit<Person, 'email'> };
  offeredBooks: ExchangeBook[];
}

/** One page of a larger list, as returned by the Book list. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
