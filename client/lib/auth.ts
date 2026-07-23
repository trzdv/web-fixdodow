export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Simple hash function for passwords (for demo - not production secure)
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const defaultUsers: User[] = [
  {
    id: '1',
    username: 'dodow',
    password: hashPassword('deadodow12'),
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

const normalizeStoredUsers = (storedUsers: unknown): User[] => {
  if (!Array.isArray(storedUsers)) {
    return defaultUsers;
  }

  const normalized = storedUsers.filter(
    (user): user is Partial<User> => Boolean(user) && typeof user === 'object'
  );

  const hasDefaultUser = normalized.some((user) => user.username === defaultUsers[0].username);

  if (!hasDefaultUser) {
    return [defaultUsers[0], ...normalized.map((user) => ({
      id: user.id || Math.random().toString(36).slice(2, 11),
      username: user.username || '',
      password: user.password || '',
      role: user.role === 'admin' || user.role === 'editor' ? user.role : 'editor',
      createdAt: user.createdAt || new Date().toISOString(),
    }))] as User[];
  }

  return normalized.map((user) => ({
    id: user.id || Math.random().toString(36).slice(2, 11),
    username: user.username || '',
    password: user.password || '',
    role: user.role === 'admin' || user.role === 'editor' ? user.role : 'editor',
    createdAt: user.createdAt || new Date().toISOString(),
  })) as User[];
};

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem('users');

  if (!stored) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }

  try {
    const parsed = JSON.parse(stored);
    const normalizedUsers = normalizeStoredUsers(parsed);

    if (JSON.stringify(normalizedUsers) !== stored) {
      localStorage.setItem('users', JSON.stringify(normalizedUsers));
    }

    return normalizedUsers;
  } catch {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const getStoredAuth = (): AuthState | null => {
  const stored = localStorage.getItem('authState');
  return stored ? JSON.parse(stored) : null;
};

export const saveAuth = (auth: AuthState): void => {
  localStorage.setItem('authState', JSON.stringify(auth));
};

export const clearAuth = (): void => {
  localStorage.removeItem('authState');
};

export const validateCredentials = (
  username: string,
  password: string
): User | null => {
  const users = getStoredUsers();
  const user = users.find((u) => u.username === username);
  
  if (user && user.password === hashPassword(password)) {
    return user;
  }
  
  return null;
};
