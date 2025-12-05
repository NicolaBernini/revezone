# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Revezone is a local-first, graphic-centric productivity tool built with Electron, React, and TypeScript. It provides whiteboard and note-taking capabilities using Excalidraw, Tldraw, and BlockSuite editors. Data is stored locally using IndexedDB and the file system, with Y.js for CRDT-based document management.

## Development Commands

### Setup and Development
```bash
npm install              # Install dependencies
npm start               # Start development server (alias for npm run dev)
npm run dev             # Start Electron app in development mode
npm run preview         # Preview production build
```

### Code Quality
```bash
npm run format          # Format code with Prettier
npm run lint            # Lint and auto-fix with ESLint
npm run typecheck       # Run both node and web type checks
npm run typecheck:node  # Type check main/preload code
npm run typecheck:web   # Type check renderer code
```

### Building
```bash
npm run build           # Full build (typecheck + electron-vite build)
npm run build:win       # Build Windows installer
npm run build:mac       # Build macOS installer
npm run build:linux     # Build Linux installer
```

## Architecture

### Electron Process Model

**Main Process** (`src/main/`):
- Entry point: `src/main/index.ts`
- Handles window management, native menus, custom fonts, and file system operations
- Local file storage at user-configurable paths (managed by `customStoragePath.ts`)
- IPC communication via events defined in `src/preload/events.ts`

**Preload** (`src/preload/`):
- Bridges main and renderer processes via `contextBridge`
- Exposes APIs: `window.api` (custom) and `window.electron` (toolkit)

**Renderer Process** (`src/renderer/src/`):
- React application with TypeScript
- Entry point: `src/renderer/src/main.tsx`

### State Management

**Jotai** (`src/renderer/src/store/jotai.ts`):
- Primary state management using atoms
- Key atoms: `fileTreeAtom`, `currentFileAtom`, `tabJsonModelAtom`, `themeAtom`, `workspaceLoadedAtom`

**IndexedDB Storage** (`src/renderer/src/store/`):
- `fileTreeIndexeddb.ts` - File/folder hierarchy management
- `blocksuite.ts` - BlockSuite/Y.js workspace for notes
- `boardIndexeddb.ts` - Excalidraw board data
- `tldrawIndexeddb.ts` - Tldraw board data

**LocalStorage** (`src/renderer/src/store/localstorage.ts`):
- Lightweight persistence for UI state

### File Type System

Revezone supports multiple file types (`src/renderer/src/types/file.ts`):
- `note` - Notion-like editor using BlockSuite (`.md` files)
- `board` - Excalidraw whiteboard (`.excalidraw` files)
- `tldraw` - Tldraw whiteboard (`.tldr` files)
- `welcome` - Welcome page (virtual, no file)
- `mindmap` - Mind mapping (experimental)

File tree uses `react-complex-tree` with a normalized structure keyed by file/folder IDs.

### Tab Management

**FlexLayout** (`flexlayout-react`):
- Multi-tab interface with drag-and-drop, split views
- Tab state persisted as JSON model in `tabJsonModelAtom`
- Factory function in `MultiTabsWithFlexLayout/index.tsx` renders appropriate editor per file type

### Local File System Sync (Desktop App)

When running as Electron app (`src/main/utils/localFilesStorage.ts`):
- Files synced to user-configurable directory
- Folder structure mirrors file tree hierarchy
- File extensions: `.md` (note), `.excalidraw` (board), `.tldr` (tldraw)
- IPC events: `fileDataChange`, `addFile`, `deleteFileOrFolder`, `renameFileOrFolder`, `dragAndDrop`

### Custom Fonts (Desktop App)

Users can upload custom fonts for Excalidraw boards:
- Font registration in `src/main/utils/customFonts.ts`
- Fonts loaded via CSS `@font-face` injection
- Persisted across sessions using `electron-store`

### Deep Linking

Protocol handler: `revezone://` links open specific files:
- Windows: `process.argv` parsing
- macOS: `open-url` event
- File ID extracted from URL, file opened in tab

### Internationalization

`i18next` with React bindings:
- Locales: `src/renderer/src/i18n/locales/` (en, zh-CN, zh-TW)
- Language switcher updates `langCodeAtom`

## Key Dependencies

- **@revesuite/\*** - BlockSuite editor packages (Notion-like editing)
- **@tldraw/tldraw** - Tldraw whiteboard library
- **revemate** - Wrapper around Excalidraw
- **yjs** - CRDT for collaborative editing infrastructure
- **y-indexeddb** - IndexedDB persistence for Y.js
- **jotai** - State management
- **flexlayout-react** - Tab layout system
- **react-complex-tree** - File tree component
- **electron-vite** - Vite-based Electron build tool

## Build Configuration

**electron-vite.config.ts**:
- Main/preload: Externalized deps, bytecode compilation, minification
- Renderer: React plugin, code splitting by vendor (antd, revesuite, tldraw), tree shaking
- Alias: `@renderer` → `src/renderer/src`

**TypeScript**:
- `tsconfig.node.json` - Main/preload config
- `tsconfig.web.json` - Renderer config
- Strict mode enabled

## Important Implementation Notes

### BlockSuite/Y.js Integration
- Single workspace instance (`blocksuiteStorage`) shared across all notes
- Pages keyed by file ID: `space:{fileId}`
- IndexedDB persistence via `y-indexeddb` (`IndexeddbPersistence`)
- `workspaceLoadedAtom` signals when Y.js sync complete

### File Tree Structure
- Normalized tree with `root` as top-level node
- Each item: `{ index, canMove, canRename, isFolder, children, data }`
- `data` field contains `RevezoneFile` or `RevezoneFolder`
- File IDs prefixed: `folder_*` for folders, file type prefix for files

### IPC Communication Pattern
Main → Renderer: `ipcRenderer.on(EVENTS.*, callback)`
Renderer → Main: `ipcRenderer.send(EVENTS.*, ...args)`
All events centralized in `src/preload/events.ts`

### Theme System
- Light/dark mode controlled by `themeAtom`
- Ant Design theme configuration in `src/renderer/src/utils/theme.ts`
- CSS custom properties for theming

## Common Gotchas

- **File saves in Excalidraw**: Requires `--enable-experimental-web-platform-features` flag (already set in `src/main/index.ts`)
- **Y.js workspace ready**: Wait for `workspaceLoadedAtom` before creating/accessing pages
- **File tree updates**: Must update both IndexedDB and Jotai atom; IPC events handle filesystem sync
- **Tab persistence**: Tab JSON model saved to localStorage; stale file references possible after deletion
- **Custom fonts**: Only available in desktop app, not web version
