# Project State - In Memoriam Pascal

## Project Overview

- **Name**: In Memoriam Pascal
- **Type**: Interactive Pascal Learning Web Application (PWA)
- **Stack**: React 19 + TypeScript + Vite + Monaco Editor + Pascal.js
- **Status**: Partially functional with issues

## Current Issues

### 1. Git Submodule Not Initialized (CRITICAL)

- **Location**: `external/pascal.js/`
- **Problem**: Pascal compiler files may not be fully present
- **Expected files**: parse.js, units/system.js (not found in listing)
- **Fix**: Run `git submodule update --init --recursive`

### 2. Missing PWA Icons (HIGH)

- **Location**: `public/icons/`
- **Problem**: Manifest references missing icons:
  - `icon-192.png`
  - `icon-512.png`
  - `maskable-icon.png`
- **Impact**: PWA installation fails

### 3. Service Worker Too Restrictive (MEDIUM)

- **Location**: `src/sw.ts`
- **Problem**: `allowlist: [/^\/$/]` only caches root URL
- **Impact**: SPA navigation doesn't work offline

### 4. Missing Favicon (LOW)

- **Location**: `public/favicon.ico`

## Architecture

- React Router 7 for routing (lazy-loaded)
- Zustand for state management
- Monaco Editor with custom Pascal language support
- Pascal.js compiler via script loading

## Environment

- Node.js (check package.json for version)
- Vite 6
- TypeScript 5.x
