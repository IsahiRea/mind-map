# Quick Reference

Quick reference for development and usage.

## Commands

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
| `npm test`        | Run Vitest tests         |

## Keyboard Shortcuts

### Global

| Shortcut | Action                                |
| -------- | ------------------------------------- |
| `Escape` | Close modal / Clear search / Deselect |

### Home Page

| Shortcut       | Action                      | Notes           |
| -------------- | --------------------------- | --------------- |
| `Ctrl/Cmd + N` | Open New Topic modal        | Owner mode only |
| `Ctrl/Cmd + K` | Focus search bar            |                 |
| `Escape`       | Clear search / Close modals |                 |

### Topic Map Page

| Shortcut       | Action                      | Notes           |
| -------------- | --------------------------- | --------------- |
| `Ctrl/Cmd + N` | Open Add Node modal         | Owner mode only |
| `+` or `=`     | Zoom in                     | +10%            |
| `-`            | Zoom out                    | -10%            |
| `Delete`       | Delete selected node        | Owner mode only |
| `Escape`       | Close modal / Deselect node |                 |

**Note**: Mac users use `Cmd` instead of `Ctrl`.

## Environment Variables

Required in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Testing Checklist

### Visitor Mode (Not Authenticated)

- [ ] Can view topics list
- [ ] Can open topic maps
- [ ] Can view nodes and connections
- [ ] "Sign In" button visible in header
- [ ] No "New Topic" button
- [ ] No "Add Node" button
- [ ] No delete buttons on topics
- [ ] Nodes not draggable
- [ ] Node details modal has no edit/delete buttons

### Owner Mode (Authenticated)

- [ ] Header shows user email
- [ ] "New Topic" button visible
- [ ] Can create topics
- [ ] Can delete topics
- [ ] "Add Node" button visible
- [ ] Can create nodes
- [ ] Can drag nodes (position persists)
- [ ] Can delete nodes
- [ ] Edit/delete buttons in node details modal

### Authentication

- [ ] Can sign in with valid credentials
- [ ] Error on invalid credentials
- [ ] Loading state shows during request
- [ ] UI updates to Owner Mode after sign in
- [ ] Click email to sign out
- [ ] Returns to Visitor Mode after sign out
- [ ] Auth state persists on page refresh

### Database

- [ ] Topics load on homepage
- [ ] Topics display correct node counts
- [ ] New topics save to database
- [ ] Deleted topics remove from database
- [ ] Nodes load on topic map
- [ ] Node positions persist after drag
- [ ] Connections display correctly
- [ ] Data persists across sessions

## File Locations

### Entry Points

| File           | Purpose                            |
| -------------- | ---------------------------------- |
| `src/main.jsx` | Application entry, env validation  |
| `src/App.jsx`  | Root component, routing, providers |

### Features

| Feature | Location               |
| ------- | ---------------------- |
| Auth    | `src/features/auth/`   |
| Topics  | `src/features/topics/` |
| Nodes   | `src/features/nodes/`  |

### Shared Code

| Type            | Location                       |
| --------------- | ------------------------------ |
| Components      | `src/shared/components/`       |
| Form Components | `src/shared/components/forms/` |
| Hooks           | `src/shared/hooks/`            |
| Constants       | `src/shared/constants/`        |

### Configuration

| File                     | Purpose            |
| ------------------------ | ------------------ |
| `src/lib/supabase.js`    | Supabase client    |
| `src/lib/queryClient.js` | React Query config |
| `src/lib/env.js`         | Env validation     |

### Database

| File                         | Purpose                     |
| ---------------------------- | --------------------------- |
| `supabase-schema.sql`        | Database schema + seed data |
| `supabase-auth-policies.sql` | RLS policies for auth       |

## Import Patterns

```javascript
// From features (use barrel exports)
import { AuthModal, useAuth } from '../../features/auth'
import { TopicCard, useTopics } from '../../features/topics'
import { MapNode, useNodes } from '../../features/nodes'

// From shared
import { Header, Modal, Input, TextArea } from '../../shared'
import { useDebounce, useDraggable } from '../../shared'
```

## API Quick Reference

### useAuth

```javascript
const {
  user, // Current user or null
  session, // Current session or null
  loading, // Auth state loading
  error, // Error message
  signIn, // (email, password) => Promise
  signOut, // () => Promise
  isAuthenticated, // Boolean
} = useAuth()
```

### useVisitorMode

```javascript
const { isVisitorMode } = useVisitorMode()
// true when NOT authenticated
```

### useTopics

```javascript
const {
  topics, // Array of topics
  isLoading, // Boolean
  error, // Error object
  createTopic, // (data) => Promise
  deleteTopic, // (id) => Promise
} = useTopics()
```

### useNodes

```javascript
const {
  nodes, // Array of nodes
  connections, // Array of connections
  isLoading, // Boolean
  error, // Error object
  createNode, // (data) => Promise
  updateNode, // (id, data) => Promise
  updateNodePosition, // (id, position) => Promise
  deleteNode, // (id) => Promise
  createConnection, // (fromId, toId) => Promise
  deleteConnection, // (id) => Promise
} = useNodes(topicId)
```

## Common Issues

| Issue               | Solution                                      |
| ------------------- | --------------------------------------------- |
| Missing env vars    | Check `.env.local` exists, restart dev server |
| Can't write data    | Run `supabase-auth-policies.sql`, verify auth |
| Network errors      | Check Supabase project is active              |
| Auth not persisting | Clear browser cache, check localStorage       |
| CORS errors         | Use Project URL (not API URL), use anon key   |

## Useful Links

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query)
- [React Router Docs](https://reactrouter.com)
