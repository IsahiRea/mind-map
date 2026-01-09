# Code Execution Flow

This document describes how the Mind-Map application executes from startup to rendering.

## Application Entry Point

```
index.html
    └── main.jsx (entry point)
        ├── Environment validation (lib/env.js)
        └── React.createRoot()
            └── App.jsx
```

### main.jsx

1. **Environment Validation** - Validates required environment variables before rendering
2. **Error Handling** - Shows configuration error UI if env vars are missing
3. **React Initialization** - Renders App component in StrictMode

```javascript
// Entry point flow
validateEnv() // Throws if VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing
createRoot('#root') // Initialize React
render(<App />) // Render application
```

## Provider Hierarchy

The app wraps all routes in a specific provider hierarchy:

```
<QueryClientProvider>         // React Query for data fetching/caching
  <BrowserRouter>             // React Router for navigation
    <ErrorBoundary>           // Catches React errors
      <ThemeProvider>         // Light/dark mode
        <VisitorModeProvider> // Auth state → visitor mode
          <Suspense>          // Loading fallback for lazy routes
            <Routes>          // Page routing
```

### Provider Responsibilities

| Provider              | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `QueryClientProvider` | Manages React Query cache, provides query hooks |
| `BrowserRouter`       | URL routing, navigation history                 |
| `ErrorBoundary`       | Catches errors, displays fallback UI            |
| `ThemeProvider`       | Theme state (light/dark mode)                   |
| `VisitorModeProvider` | Derives `isVisitorMode` from auth state         |
| `Suspense`            | Shows loading spinner during code-split loads   |

## Route Definitions

```javascript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/topic/:topicId" element={<TopicMapPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

All pages are **lazy-loaded** for code splitting:

```javascript
const HomePage = lazy(() => import('./features/topics/pages/HomePage'))
const TopicMapPage = lazy(() => import('./features/nodes/pages/TopicMapPage'))
```

## Data Flow Architecture

### Reading Data

```
Component
    ↓
Custom Hook (useTopics, useNodes)
    ↓
React Query (useQuery)
    ↓
Service Layer (topicsService, nodesService)
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
RLS Policies Applied
    ↓
Data returned → Transform → Hook state → Component renders
```

### Writing Data

```
User Action (click, submit)
    ↓
Event Handler
    ↓
Custom Hook mutation (createTopic, updateNode, etc.)
    ↓
React Query (useMutation)
    ↓
Service Layer
    ↓
Supabase Client
    ↓
PostgreSQL Database (RLS policies checked)
    ↓
Success → Invalidate cache → Refetch → UI updates
```

## Authentication Flow

```
App loads
    ↓
VisitorModeProvider mounts
    ↓
useAuth() initializes
    ↓
authService.getSession()
    ↓
Session exists? ──No──→ isVisitorMode = true (read-only)
    │
   Yes
    ↓
isVisitorMode = false (full access)
```

### Sign In Flow

```
User clicks "Sign In"
    ↓
AuthModal opens
    ↓
User enters credentials
    ↓
authService.signIn(email, password)
    ↓
Supabase Auth API
    ↓
JWT tokens issued
    ↓
Session stored in localStorage
    ↓
onAuthStateChange fires
    ↓
useAuth updates user/session state
    ↓
isVisitorMode → false
    ↓
UI updates (edit buttons appear)
```

## CRUD Operation Examples

### Creating a Topic

```
1. User clicks "New Topic" button
2. NewTopicModal opens
3. User fills form → submits
4. HomePage.handleCreateTopic()
5. useTopics().createTopic(data)
6. React Query mutation runs
7. topicsService.create(data)
8. supabase.from('topics').insert([data])
9. Database creates record
10. Mutation succeeds → invalidate queries
11. Topics refetch automatically
12. UI shows new topic
```

### Creating a Node

```
1. User clicks "Add Node" button
2. AddNodeModal opens
3. User fills form → submits
4. TopicMapPage.handleCreateNode()
5. useNodes().createNode(data)
6. nodesService.create(data)
7. supabase.from('learning_nodes').insert([data])
8. Database creates record
9. Nodes refetch → UI updates
```

### Dragging a Node

```
1. User starts dragging node
2. useDraggable hook tracks position
3. Component re-renders with new position
4. User releases (onDragEnd)
5. useNodes().updateNodePosition(id, position)
6. nodesService.updatePosition(id, position)
7. supabase.from('learning_nodes').update({ position })
8. Database saves position
9. Position persists on refresh
```

### Deleting Data

```
1. User clicks delete button
2. Confirmation modal appears (topics only)
3. User confirms
4. Hook.delete(id) called
5. Service.delete(id)
6. supabase.from('table').delete().eq('id', id)
7. Database deletes (cascades to children)
8. Cache invalidated → refetch → UI updates
```

## Service Layer Pattern

Each feature has a dedicated service that:

- Abstracts Supabase queries
- Transforms data (snake_case ↔ camelCase)
- Handles errors consistently

```
src/features/
├── topics/services/topicsService.js    # Topic CRUD
├── nodes/services/nodesService.js      # Node CRUD
│          services/connectionsService.js # Connection CRUD
└── auth/services/authService.js        # Authentication
```

### Service Method Structure

```javascript
async create(data) {
  const { data: result, error } = await supabase
    .from('table_name')
    .insert([transformToDbFormat(data)])
    .select()
    .single()

  if (error) throw error
  return transformToUiFormat(result)
}
```

## Custom Hooks Pattern

Hooks provide the interface between components and services:

```javascript
function useTopics() {
  const queryClient = useQueryClient()

  // Fetch topics
  const { data, isLoading, error } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsService.getAll(),
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: data => topicsService.create(data),
    onSuccess: () => queryClient.invalidateQueries(['topics']),
  })

  return {
    topics: data ?? [],
    isLoading,
    error,
    createTopic: createMutation.mutateAsync,
  }
}
```

## Visitor Mode Behavior

When `isVisitorMode = true`:

| Feature            | Behavior                  |
| ------------------ | ------------------------- |
| View topics        | Allowed                   |
| View nodes         | Allowed                   |
| Create/edit/delete | Disabled (buttons hidden) |
| Drag nodes         | Disabled                  |
| Sign In button     | Visible                   |

When `isVisitorMode = false`:

| Feature             | Behavior        |
| ------------------- | --------------- |
| All read operations | Allowed         |
| Create/edit/delete  | Allowed         |
| Drag nodes          | Allowed         |
| User email          | Shown in header |

## Error Handling

### Component Level

- ErrorBoundary catches React errors
- Shows fallback UI with error details

### Query Level

- React Query retry logic (3 attempts)
- Error state returned to components
- Error messages displayed in UI

### Service Level

- Try/catch blocks
- Errors thrown to caller
- Console logging for debugging
