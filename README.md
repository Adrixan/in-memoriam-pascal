# In Memoriam Pascal

An interactive Pascal programming tutorial web application with a retro 80s CRT aesthetic. Learn Pascal programming through 10 progressive levels with real-time in-browser code execution.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)

## Features

- **10 Progressive Tutorial Levels** - From "Hello World" to advanced algorithms
- **Real-time Pascal Execution** - In-browser compilation and execution via Pascal.js
- **Monaco Code Editor** - Full-featured editor with Pascal syntax highlighting and custom CRT theme
- **Interactive Hint System** - Progressive disclosure hints to guide learning
- **Solution Validation** - Automatic checking with context-aware error feedback
- **Offline Support** - PWA with service worker for offline usage
- **Progress Persistence** - IndexedDB storage for code and progress
- **German/English Localization** - Full i18n support
- **Retro CRT Aesthetic** - Authentic 80s terminal visual experience
- **Accessibility** - WCAG 2.1 AA compliant

## Screenshots

<!-- Add screenshots here -->
*Coming soon*

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 |
| **Language** | TypeScript 5.7 |
| **Build Tool** | Vite 6 |
| **State Management** | Zustand 5 |
| **Code Editor** | Monaco Editor |
| **Pascal Execution** | Pascal.js (LLVM.js-based) |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **i18n** | i18next + react-i18next |
| **Storage** | IndexedDB (native) |
| **PWA** | vite-plugin-pwa + Workbox |
| **Testing** | Vitest + Testing Library + Playwright |
| **Icons** | Lucide React |

## Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/in-memoriam-pascal.git
cd in-memoriam-pascal

# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

## Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Testing

```bash
# Run unit and integration tests
npm run test

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Project Structure

```
in-memoriam-pascal/
├── public/                 # Static assets
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   └── robots.txt
├── src/
│   ├── components/         # React components
│   │   ├── common/         # Shared UI components (CRTOverlay, RetroButton, RetroPanel)
│   │   ├── editor/         # Code editor components (CodeEditor, OutputWindow, RunButton)
│   │   ├── layout/         # Layout components (Header, Layout)
│   │   └── tutorial/       # Tutorial components (HintSystem, LevelCard, LevelNav, etc.)
│   ├── data/               # Tutorial content and level definitions
│   ├── hooks/              # Custom React hooks
│   ├── i18n/               # Internationalization configuration and translations
│   │   └── locales/        # Translation files (de, en)
│   ├── lib/                # Utility libraries
│   │   ├── storage/        # IndexedDB wrapper and Zustand adapter
│   │   └── utils/          # Utility functions
│   ├── pages/              # Page components (HomePage, TutorialPage, NotFoundPage)
│   ├── services/           # Business logic services
│   │   ├── interpreter/    # Pascal interpreter service
│   │   └── validation/     # Solution validation and error analysis
│   ├── stores/             # Zustand state stores
│   ├── styles/             # Global styles
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── sw.ts               # Service worker for PWA
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── external/               # External dependencies (pascal.js submodule)
├── package.json
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
├── playwright.config.ts    # Playwright configuration
└── tsconfig.json           # TypeScript configuration
```

## Tutorial Levels

| Level | Title | Topics Covered |
|-------|-------|----------------|
| 1 | Hello World | Program structure, `WriteLn` |
| 2 | Variables | Data types, variable declaration |
| 3 | Input/Output | `ReadLn`, user interaction |
| 4 | Arithmetic | Operators, expressions |
| 5 | Conditions | `If-Then-Else`, boolean logic |
| 6 | Loops | `For`, `While`, `Repeat` |
| 7 | Procedures | Procedures, parameters |
| 8 | Functions | Functions, return values |
| 9 | Arrays | Array declaration, iteration |
| 10 | Records | Records, structured data |

## PWA Features

- **Offline Support**: Full application works offline after first load
- **Installable**: Add to home screen on mobile and desktop
- **Auto-update**: Service worker updates automatically
- **Precaching**: Critical assets cached for instant loading

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Pascal.js](https://github.com/nicholaslee119/pascal.js) - In-browser Pascal compiler
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Lucide](https://lucide.dev/) - Icon set
