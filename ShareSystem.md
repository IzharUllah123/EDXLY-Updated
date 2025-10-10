# EDXLY Share System Documentation

## Overview
The EDXLY Share System allows users to create collaborative drawing boards with real-time sharing capabilities. Hosts can generate unique board links, while guests can join existing sessions without requiring authentication.

## Core Components

### 1. ShareModal (`src/components/edxly/ShareModal.tsx`)
The main sharing interface that allows users to:
- Enter their name as Host
- Generate new unique board links
- Use previously created links
- Copy shareable URLs

#### Key Features:
- **Generate New Link**: Creates a unique board ID and redirects to `/board/{id}`
- **Last Shared Link**: Displays the most recent board link for reuse
- **Host Name Input**: Validates and stores the host's name
- **URL Copying**: Clipboard functionality for sharing links

### 2. BoardPage (`src/pages/BoardPage.tsx`)
The live collaborative board interface that:
- Determines if user is Host or Guest based on stored link data
- Shows appropriate join modal for guests
- Displays board controls and status

#### Key Features:
- **Host/Guest Differentiation**: Automatic role detection
- **JoineeModal**: Guest name entry component
- **Real-time Sync Integration**: Connects to sync system
- **Status Display**: Shows connection and participant information

### 3. JoineeModal Component
Integrated modal for guest users to:
- Enter their display name
- Join the collaborative session
- Access the board without host controls

### 4. Real-time Sync Hook (`src/hooks/useRealtimeSync.ts`)
Placeholder sync system using localStorage for:
- Board state management
- Participant tracking
- Real-time drawing element sync

#### Current Status:
- **Placeholder Implementation**: Uses localStorage as temporary solution
- **WebSocket/Firebase Ready**: Architecture prepared for proper real-time implementation
- **Data Structure**: Complete board and participant management

## Data Flow

### 1. Host Creates Share Link
```
ShareModal → Generate New Link → Store in localStorage → Redirect to /board/{id}
```

### 2. Guest Joins Board
```
Click Shared Link → BoardPage → Show JoineeModal → Enter Name → Join Board
```

### 3. Real-time Collaboration
```
Host/Guest Actions → useRealtimeSync Hook → localStorage Broadcast → UI Updates
```

## File Structure
```
src/
├── components/
│   └── edxly/
│       └── ShareModal.tsx      # Main sharing modal
├── pages/
│   └── BoardPage.tsx           # Live collaborative board
├── hooks/
│   └── useRealtimeSync.ts      # Real-time sync management
└── routes.tsx                  # Route configuration for /board/{id}
```

## API Integration Points

### WebSocket/Firebase Integration (Future)
The system is designed to easily integrate proper real-time infrastructure:

1. **Replace localStorage Sync**: Update `useRealtimeSync.ts` with WebSocket/Firebase calls
2. **Authentication**: Add optional guest authentication if needed
3. **Persistence**: Connect to database for board history
4. **Advanced Features**: Add online/offline detection, better conflict resolution

### Current localStorage Keys:
- `edxly-last-shared-link`: Stores host-generated links for session reuse
- `board-${boardId}`: Board state with participants and drawing elements

## Usage Guide

### For Hosts:
1. Click the Blue Share Button in the floating toolbar
2. Enter your name as Host in the modal
3. Click "Generate New Link"
4. Share the URL with collaborators
5. Control the drawing session when joined

### For Guests:
1. Open the shared URL `/board/{boardId}`
2. Enter your name in the join modal
3. Click "Join as Guest"
4. Participate in the collaborative drawing

## Future Enhancements

### Phase 1: Real-time Sync
- Replace localStorage with WebSocket server
- Add drawing element synchronization
- Implement proper user state management

### Phase 2: Advanced Features
- Firebase integration for scalability
- Drawing permission controls (Host controls guest abilities)
- Chat system integrated with drawing
- Board export/sharing with embedded links

### Phase 3: Enterprise Features
- User authentication and session management
- Board templates and galleries
- Team collaboration with roles
- Analytics and usage tracking

## Technical Notes

### State Management
- User role (Host/Guest) determined by comparing stored link data
- Board state managed through localStorage as placeholder
- Participant list updated automatically on join/leave

### URL Structure
- Board URLs: `https://yourdomain.com/board/{uniqueBoardId}`
- Share links are unique and persistent (stored in localStorage)

### Security Considerations
- Current implementation uses browser storage (safe for local use)
- URLs are public-accessible (add authentication if needed)
- Guest names are user-provided (consider validation for production)

## Testing Checklist
- [x] ShareModal renders correctly
- [x] New link generation redirects to board
- [x] Guest join modal appears for non-hosts
- [x] Host/Guest role detection works
- [x] Real-time sync architecture in place
- [ ] WebSocket integration (Future)
- [ ] Multi-user testing (Future)
- [ ] Cross-browser compatibility (Future)

---

**Status**: Share system is functional with localStorage sync. Ready for real-time infrastructure integration.
