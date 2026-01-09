# Architecture

Technical architecture reference for the Mind-Map application.

## Folder Structure

The codebase uses a **feature-based** architecture:

```
src/
├── features/                   # Feature modules (colocated code)
│   ├── auth/                   # Authentication & visitor mode
│   │   ├── components/         # AuthModal
│   │   ├── hooks/              # useAuth
│   │   ├── services/           # authService
│   │   ├── context/            # VisitorModeContext
│   │   └── index.js            # Barrel exports
│   ├── topics/                 # Topic management
│   │   ├── components/         # TopicCard, NewTopicModal, DeleteTopicModal
│   │   ├── hooks/              # useTopics
│   │   ├── services/           # topicsService
│   │   ├── pages/              # HomePage
│   │   └── index.js            # Barrel exports
│   └── nodes/                  # Mind map nodes & connections
│       ├── components/         # MapNode, ConnectionLine, AddNodeModal, NodeDetailsModal
│       ├── hooks/              # useNodes
│       ├── services/           # nodesService, connectionsService
│       ├── pages/              # TopicMapPage
│       └── index.js            # Barrel exports
├── shared/                     # Shared/reusable code
│   ├── components/             # Header, Modal, ErrorBoundary
│   │   └── forms/              # Input, TextArea, ColorPicker, Checkbox
│   ├── hooks/                  # useDebounce, useDraggable, useFormValidation
│   ├── constants/              # Color themes
│   ├── context/                # ThemeContext
│   └── index.js                # Barrel exports
├── lib/                        # External library configuration
│   ├── supabase.js             # Supabase client setup
│   ├── queryClient.js          # React Query client config
│   └── env.js                  # Environment variable validation
├── css/                        # Global and component styles
└── schemas/                    # Validation schemas
```

### Import Conventions

```javascript
// Feature imports (use barrel exports)
import { AuthModal, useAuth } from '../../features/auth'
import { TopicCard, useTopics } from '../../features/topics'
import { MapNode, useNodes } from '../../features/nodes'

// Shared imports
import { Header, Modal, Input, useDebounce } from '../../shared'
```

## Database Schema

### Tables

```sql
-- Topics (learning journey containers)
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon_bg_color VARCHAR(7) DEFAULT '#E0E7FF',
    icon_color VARCHAR(7) DEFAULT '#4F46E5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Nodes (individual items in a topic)
CREATE TABLE learning_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    position JSONB DEFAULT '{"x": 100, "y": 100}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Node Connections (relationships between nodes)
CREATE TABLE node_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id UUID REFERENCES learning_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES learning_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id)
);
```

### Views

```sql
-- Optimized topic list with node counts
CREATE VIEW topics_with_counts AS
SELECT
    t.*,
    COUNT(ln.id) as node_count
FROM topics t
LEFT JOIN learning_nodes ln ON t.id = ln.topic_id
GROUP BY t.id;
```

### Functions

```sql
-- Get connection count for a node
CREATE OR REPLACE FUNCTION get_node_connection_count(node_uuid UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER
    FROM node_connections
    WHERE from_node_id = node_uuid OR to_node_id = node_uuid;
$$ LANGUAGE SQL STABLE;
```

### Indexes

```sql
CREATE INDEX idx_learning_nodes_topic_id ON learning_nodes(topic_id);
CREATE INDEX idx_node_connections_from ON node_connections(from_node_id);
CREATE INDEX idx_node_connections_to ON node_connections(to_node_id);
```

## Service Layer

Services abstract database operations and handle data transformation.

### Pattern

```javascript
// Service structure
const service = {
  async getAll() {
    const { data, error } = await supabase.from('table').select('*')
    if (error) throw error
    return data.map(transformToUiFormat)
  },

  async create(item) {
    const { data, error } = await supabase
      .from('table')
      .insert([transformToDbFormat(item)])
      .select()
      .single()
    if (error) throw error
    return transformToUiFormat(data)
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('table')
      .update(transformToDbFormat(updates))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return transformToUiFormat(data)
  },

  async delete(id) {
    const { error } = await supabase.from('table').delete().eq('id', id)
    if (error) throw error
  },
}
```

### Data Transformation

```javascript
// Database (snake_case) ↔ UI (camelCase)
function transformToUiFormat(dbRow) {
  return {
    id: dbRow.id,
    topicId: dbRow.topic_id,
    iconBgColor: dbRow.icon_bg_color,
    createdAt: dbRow.created_at,
  }
}

function transformToDbFormat(uiData) {
  return {
    topic_id: uiData.topicId,
    icon_bg_color: uiData.iconBgColor,
  }
}
```

## Custom Hooks

### Data Fetching Hooks

```javascript
function useTopics() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['topics'],
    queryFn: () => topicsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: topicsService.create,
    onSuccess: () => queryClient.invalidateQueries(['topics']),
  })

  return {
    topics: data ?? [],
    isLoading,
    error,
    createTopic: createMutation.mutateAsync,
    deleteTopic: deleteMutation.mutateAsync,
  }
}
```

### Utility Hooks

| Hook                   | Purpose                       |
| ---------------------- | ----------------------------- |
| `useDraggable`         | Drag-and-drop logic for nodes |
| `useFormValidation`    | Form state and validation     |
| `useDebounce`          | Debounce values (search)      |
| `useLocalStorage`      | Sync state with localStorage  |
| `useKeyboardShortcuts` | Keyboard shortcut handling    |

## Authentication Architecture

### Flow

```
VisitorModeProvider
    ↓
useAuth() hook
    ↓
authService
    ↓
Supabase Auth API
    ↓
Session stored (localStorage)
    ↓
isAuthenticated → isVisitorMode derived
```

### State Management

```javascript
// Authentication state
const { user, isAuthenticated, signIn, signOut } = useAuth()

// Visitor mode (derived)
const { isVisitorMode } = useVisitorMode()
// isVisitorMode = !isAuthenticated
```

### API

```javascript
// authService methods
signUp(email, password) // Register new user
signIn(email, password) // Authenticate
signOut() // End session
getSession() // Get current session
getUser() // Get current user
onAuthStateChange(callback) // Listen for auth events
```

## Security (RLS Policies)

Row Level Security enforces access control at the database level.

### Read Access (Public)

```sql
-- Anyone can read (visitor mode)
CREATE POLICY "Allow public read access on topics" ON topics
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on learning_nodes" ON learning_nodes
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on node_connections" ON node_connections
    FOR SELECT USING (true);
```

### Write Access (Authenticated Only)

```sql
-- Only authenticated users can write
CREATE POLICY "Authenticated users can insert topics" ON topics
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update topics" ON topics
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete topics" ON topics
    FOR DELETE TO authenticated
    USING (true);
```

Same pattern applied to `learning_nodes` and `node_connections`.

## React Query Configuration

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})
```

## Reusable Form Components

Located in `src/shared/components/forms/`:

| Component     | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `Input`       | Text input with label, error state, validation |
| `TextArea`    | Multi-line text input                          |
| `ColorPicker` | Theme color selector with visual feedback      |
| `Checkbox`    | Checkbox with label                            |

```javascript
import { Input, TextArea, ColorPicker } from '../../../shared'

;<Input
  label="Topic Name"
  value={name}
  onChange={e => setName(e.target.value)}
  error={errors.name}
  required
/>
```

## Performance Optimizations

### Database Level

- Indexes on foreign keys
- Views for pre-computed data
- Server-side functions

### Application Level

- React Query caching (5-minute stale time)
- Lazy-loaded routes (code splitting)
- Position updates only on drag end
- Memoization for expensive calculations

## Error Handling

### Layers

1. **ErrorBoundary** - Catches React errors, shows fallback UI
2. **React Query** - Retry logic (3 attempts), error state
3. **Service Layer** - Try/catch, throws to caller
4. **UI** - Displays user-friendly error messages
