# AGENTS.md - Church App (Frontend)

This document provides guidelines for AI agents working on the frontend codebase.

## Project Overview

- **Type**: Single Page Application (SPA)
- **Stack**: React 19, Vite, Zustand, TailwindCSS, React Router
- **Port**: 5173 (default dev server)

---

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Production build (outputs to dist/)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Running Tests

No test framework is configured. To add tests:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Then run a single test file:

```bash
npx vitest run src/store/memberStore.test.js
```

---

## Code Style Guidelines

### General Conventions

- **Language**: Spanish for comments, user-facing text
- **Code**: English for variable/function names (camelCase)
- **ESLint**: Configured with React hooks and refresh plugins
- **ES Modules**: Use import/export syntax

### Import Order

```javascript
// 1. React/React Router
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// 2. External libraries
import axios from 'axios';
import { create } from 'zustand';
import { useForm } from 'react-hook-form';

// 3. Internal modules
import api from './services/api';
import { useMemberStore } from './store/memberStore';
import MemberList from './components/MemberList';
```

### JavaScript Guidelines

- **Prefer const** over let; never use var
- **Use ES modules** (import/export)
- **Prefer async/await** over .then() chains
- **Name stores with `use` prefix**: `useMemberStore`, `useAuthStore`

```javascript
// Good - Zustand store
export const useMemberStore = create((set) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/members');
      set({ members: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

// Good - async/await
const handleSubmit = async (data) => {
  try {
    await api.post('/members', data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.error };
  }
};
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `memberId`, `fetchMembers` |
| Functions | camelCase | `getMemberById()` |
| Components | PascalCase | `MemberList.jsx` |
| Stores | use + PascalCase | `useAuthStore` |
| API endpoints | kebab-case | `/api/miembros` |
| Files | kebab-case | `member-store.js`, `api-service.js` |

---

## Components

- Use **PascalCase** for component names and filenames
- Use functional components with hooks
- Follow container/presentational pattern for complex components

```jsx
// Good - MemberList.jsx
import React, { useEffect } from 'react';
import { useMemberStore } from '../store/memberStore';

export default function MemberList() {
  const { members, fetchMembers, loading } = useMemberStore();

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (loading) return <div>Cargando...</div>;

  return (
    <ul>
      {members.map((member) => (
        <li key={member.id}>{member.nombres}</li>
      ))}
    </ul>
  );
}
```

---

## State Management (Zustand)

- Create stores in `src/store/`
- Use `use` prefix for store name
- Return success/error objects from async actions

```javascript
// src/store/memberStore.js
import { create } from 'zustand';
import api from '../services/api';

export const useMemberStore = create((set) => ({
  members: [],
  loading: false,
  error: null,

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/members');
      set({ members: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createMember: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/members', data);
      set((state) => ({ 
        members: [...state.members, response.data], 
        loading: false 
      }));
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, message: error.response?.data?.error };
    }
  },
}));
```

---

## API Service

- Use axios with interceptors for auth
- Store JWT in localStorage

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## TailwindCSS

- Use utility classes for styling
- Follow responsive design with `md:`, `lg:` prefixes

```jsx
// Good
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h2 className="text-xl font-semibold text-gray-800">Miembros</h2>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Agregar
  </button>
</div>
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite bundler config |
| `eslint.config.js` | ESLint rules |
| `tailwind.config.js` | TailwindCSS config |
| `package.json` | Dependencies and scripts |

---

## Environment Variables

Create `.env` in project root:

```
VITE_API_URL=http://localhost:3000/api
```

---

## Adding a New Store

1. Create file in `src/store/` (e.g., `event-store.js`)
2. Use Zustand's `create()` with state and actions
3. Export with `use` prefix:

```javascript
export const useEventStore = create((set) => ({
  events: [],
  fetchEvents: async () => { /* ... */ },
}));
```

---

## Adding a New Component

1. Create in `src/components/`
2. Use PascalCase filename: `MemberForm.jsx`
3. Follow container/presentational pattern for complex components

---

## Recommendations

1. **Add testing**: Install Vitest with React Testing Library
2. **Add type checking**: Consider migrating to TypeScript
3. **Add routing**: Use React Router for navigation
4. **Add form validation**: Use react-hook-form with Zod
