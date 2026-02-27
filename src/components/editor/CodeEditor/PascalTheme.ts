/**
 * Retro Theme for Monaco Editor
 * CRT-inspired color scheme matching the 80s aesthetic
 */

import type * as Monaco from 'monaco-editor';

/**
 * Theme name constant
 */
export const PASCAL_RETRO_THEME = 'pascal-retro';

/**
 * Color definitions matching globals.css CSS variables
 */
const colors = {
    // Terminal colors from globals.css
    retroGreen: '#33FF33',
    retroAmber: '#FFB000',
    retroCyan: '#00FFFF',
    retroMagenta: '#FF00FF',
    terminalBg: '#0D0D0D',
    surface: '#1A1A1A',
    text: '#E0E0E0',
    textMuted: '#888888',
    border: '#333333',
};

/**
 * Register the retro theme with Monaco
 */
export function registerPascalTheme(monaco: typeof Monaco): void {
    monaco.editor.defineTheme(PASCAL_RETRO_THEME, {
        base: 'vs-dark',
        inherit: true,
        rules: [
            // Keywords - bright green
            { token: 'keyword', foreground: colors.retroGreen, fontStyle: 'bold' },
            { token: 'keyword.control', foreground: colors.retroGreen, fontStyle: 'bold' },
            { token: 'keyword.other', foreground: colors.retroGreen, fontStyle: 'bold' },
            { token: 'keyword.declaration', foreground: colors.retroGreen, fontStyle: 'bold' },

            // Built-in functions/types - cyan
            { token: 'type.identifier', foreground: colors.retroCyan },
            { token: 'support.function', foreground: colors.retroCyan },
            { token: 'support.type', foreground: colors.retroCyan },
            { token: 'entity.name.function', foreground: colors.retroCyan },

            // Constants - amber
            { token: 'constant', foreground: colors.retroAmber },
            { token: 'constant.numeric', foreground: colors.retroAmber },
            { token: 'constant.language', foreground: colors.retroAmber },
            { token: 'constant.character', foreground: colors.retroAmber },

            // Strings - amber with slight variation
            { token: 'string', foreground: colors.retroAmber },
            { token: 'string.quoted', foreground: colors.retroAmber },

            // Numbers - amber
            { token: 'number', foreground: colors.retroAmber },
            { token: 'number.float', foreground: colors.retroAmber },
            { token: 'number.hex', foreground: colors.retroAmber },

            // Comments - muted green
            { token: 'comment', foreground: '#228B22', fontStyle: 'italic' },

            // Operators - white/light
            { token: 'operator', foreground: colors.text },
            { token: 'keyword.operator', foreground: colors.text },

            // Identifiers - default text
            { token: 'identifier', foreground: colors.text },
            { token: 'variable', foreground: colors.text },

            // Delimiters and brackets
            { token: 'delimiter', foreground: colors.textMuted },
            { token: 'delimiter.curly', foreground: colors.textMuted },
            { token: 'delimiter.parenthesis', foreground: colors.textMuted },
            { token: 'delimiter.square', foreground: colors.textMuted },

            // Punctuation
            { token: 'punctuation', foreground: colors.textMuted },
            { token: 'punctuation.definition', foreground: colors.textMuted },

            // Invalid/error
            { token: 'invalid', foreground: '#FF4444' },
            { token: 'invalid.illegal', foreground: '#FF4444' },
        ],
        colors: {
            // Editor background
            'editor.background': colors.terminalBg,
            'editor.foreground': colors.text,

            // Cursor
            'editorCursor.foreground': colors.retroGreen,
            'editorCursor.background': colors.terminalBg,

            // Selection
            'editor.selectionBackground': '#33FF3333',
            'editor.inactiveSelectionBackground': '#33FF3311',
            'editor.selectionHighlightBackground': '#33FF3322',
            'editor.selectionHighlightBorder': colors.retroGreen,

            // Line numbers
            'editorLineNumber.foreground': colors.textMuted,
            'editorLineNumber.activeForeground': colors.retroGreen,
            'editorLineNumber.dimmedForeground': '#444444',

            // Current line
            'editor.lineHighlightBackground': '#1A1A1A',
            'editor.lineHighlightBorder': '#333333',

            // Whitespace
            'editorWhitespace.foreground': '#333333',
            'editorIndentGuide.background': '#222222',
            'editorIndentGuide.activeBackground': '#333333',

            // Brackets
            'editorBracketMatch.background': '#33FF3322',
            'editorBracketMatch.border': colors.retroGreen,

            // Overview ruler (minimap area)
            'editorOverviewRuler.background': colors.surface,
            'editorOverviewRuler.border': colors.border,

            // Scrollbar
            'scrollbarSlider.background': '#33333388',
            'scrollbarSlider.hoverBackground': '#44444488',
            'scrollbarSlider.activeBackground': colors.retroGreen + '44',

            // Find/replace
            'editor.findMatchBackground': '#33FF3344',
            'editor.findMatchHighlightBackground': '#33FF3322',
            'editor.findRangeHighlightBackground': '#33FF3311',

            // Word highlights
            'editor.wordHighlightBackground': '#33FF3322',
            'editor.wordHighlightStrongBackground': '#33FF3333',

            // Hover
            'editorHoverWidget.background': colors.surface,
            'editorHoverWidget.border': colors.border,
            'editorHoverWidget.foreground': colors.text,

            // Suggestions/autocomplete
            'editorSuggestWidget.background': colors.surface,
            'editorSuggestWidget.border': colors.border,
            'editorSuggestWidget.foreground': colors.text,
            'editorSuggestWidget.highlightForeground': colors.retroGreen,
            'editorSuggestWidget.selectedBackground': '#33FF3322',
            'editorSuggestWidget.selectedForeground': colors.text,

            // Parameter hints
            'editorWidget.background': colors.surface,
            'editorWidget.border': colors.border,
            'editorWidget.foreground': colors.text,

            // Errors and warnings
            'editorError.foreground': '#FF4444',
            'editorError.background': '#FF444411',
            'editorWarning.foreground': colors.retroAmber,
            'editorWarning.background': '#FFB00011',
            'editorInfo.foreground': colors.retroCyan,
            'editorInfo.background': '#00FFFF11',

            // Links
            'editorLink.activeForeground': colors.retroCyan,

            // Ranges
            'rangeHighlight.background': '#33FF3311',

            // Inline values (debugging)
            'editor.inlineValuesBackground': '#33FF3311',
            'editor.inlineValuesForeground': colors.textMuted,

            // Sticky scroll
            'editorStickyScroll.background': colors.surface,
            'editorStickyScroll.shadow': '#00000000',

            // Gutter
            'editorGutter.background': colors.terminalBg,
            'editorGutter.addedBackground': colors.retroGreen,
            'editorGutter.modifiedBackground': colors.retroAmber,
            'editorGutter.deletedBackground': '#FF4444',

            // Diff editor
            'diffEditor.insertedTextBackground': '#33FF3322',
            'diffEditor.removedTextBackground': '#FF444422',
            'diffEditor.insertedLineBackground': '#33FF3311',
            'diffEditor.removedLineBackground': '#FF444411',

            // Search editor
            'searchEditor.findMatchBackground': '#33FF3333',
            'searchEditor.findMatchBorder': colors.retroGreen,

            // Minimap
            'minimap.background': colors.surface,
            'minimap.selectionHighlight': colors.retroGreen,
            'minimap.errorHighlight': '#FF4444',
            'minimap.warningHighlight': colors.retroAmber,
            'minimap.findMatchHighlight': colors.retroGreen,

            // Breadcrumbs
            'breadcrumb.background': colors.surface,
            'breadcrumb.foreground': colors.textMuted,
            'breadcrumb.focusForeground': colors.text,
            'breadcrumb.activeSelectionForeground': colors.retroGreen,
            'breadcrumbPicker.background': colors.surface,

            // Snippets
            'editor.snippetTabstopHighlightBackground': '#33FF3311',
            'editor.snippetTabstopHighlightBorder': colors.retroGreen,
            'editor.snippetFinalTabstopHighlightBackground': '#FFB00011',
            'editor.snippetFinalTabstopHighlightBorder': colors.retroAmber,

            // Unnecessary code (faded)
            'editorUnnecessaryCode.opacity': '#000000AA',

            // Marker navigation
            'markerNavigation.background': colors.surface,
            'markerNavigationError.background': '#FF4444',
            'markerNavigationWarning.background': colors.retroAmber,

            // Peek view
            'peekView.border': colors.retroGreen,
            'peekViewEditor.background': colors.surface,
            'peekViewEditor.matchHighlightBackground': '#33FF3333',
            'peekViewResult.background': colors.surface,
            'peekViewResult.fileForeground': colors.text,
            'peekViewResult.lineForeground': colors.textMuted,
            'peekViewResult.matchHighlightBackground': '#33FF3333',
            'peekViewResult.selectionBackground': '#33FF3322',
            'peekViewResult.selectionForeground': colors.text,
            'peekViewTitle.background': colors.surface,
            'peekViewTitleDescription.foreground': colors.textMuted,
            'peekViewTitleLabel.foreground': colors.text,

            // Editor groups (split view)
            'editorGroup.background': colors.surface,
            'editorGroup.border': colors.border,
            'editorGroup.dropBackground': '#33FF3322',
            'editorGroupHeader.background': colors.surface,
            'editorGroupHeader.noTabsBackground': colors.surface,
            'editorGroupHeader.tabsBackground': colors.surface,
            'editorGroupHeader.tabsBorder': colors.border,

            // Tabs
            'tab.activeBackground': colors.terminalBg,
            'tab.activeForeground': colors.retroGreen,
            'tab.activeBorder': colors.retroGreen,
            'tab.activeBorderTop': colors.retroGreen,
            'tab.inactiveBackground': colors.surface,
            'tab.inactiveForeground': colors.textMuted,
            'tab.border': colors.border,
            'tab.hoverBackground': '#1A1A1A',
            'tab.hoverForeground': colors.text,
            'tab.unfocusedActiveBackground': colors.terminalBg,
            'tab.unfocusedActiveForeground': colors.text,
            'tab.unfocusedInactiveBackground': colors.surface,
            'tab.unfocusedInactiveForeground': colors.textMuted,
            'tab.unfocusedHoverBackground': '#1A1A1A',

            // Panel
            'panel.background': colors.surface,
            'panel.border': colors.border,
            'panel.dropBorder': colors.retroGreen,
            'panelTitle.activeBorder': colors.retroGreen,
            'panelTitle.activeForeground': colors.text,
            'panelTitle.inactiveForeground': colors.textMuted,

            // Status bar
            'statusBar.background': colors.surface,
            'statusBar.foreground': colors.textMuted,
            'statusBar.border': colors.border,
            'statusBar.debuggingBackground': colors.retroAmber,
            'statusBar.debuggingForeground': colors.terminalBg,
            'statusBar.noFolderForeground': colors.textMuted,
            'statusBar.noFolderBackground': colors.surface,
            'statusBarItem.activeBackground': '#33FF3333',
            'statusBarItem.hoverBackground': '#33FF3322',
            'statusBarItem.prominentBackground': colors.retroGreen,
            'statusBarItem.prominentForeground': colors.terminalBg,
            'statusBarItem.prominentHoverBackground': '#33FF3344',
            'statusBarItem.remoteBackground': colors.retroCyan,
            'statusBarItem.remoteForeground': colors.terminalBg,
            'statusBarItem.errorBackground': '#FF4444',
            'statusBarItem.errorForeground': colors.terminalBg,
            'statusBarItem.warningBackground': colors.retroAmber,
            'statusBarItem.warningForeground': colors.terminalBg,

            // Title bar
            'titleBar.activeBackground': colors.surface,
            'titleBar.activeForeground': colors.text,
            'titleBar.inactiveBackground': colors.surface,
            'titleBar.inactiveForeground': colors.textMuted,
            'titleBar.border': colors.border,

            // Menu
            'menu.background': colors.surface,
            'menu.border': colors.border,
            'menu.foreground': colors.text,
            'menu.selectionBackground': '#33FF3322',
            'menu.selectionForeground': colors.text,
            'menu.separatorBackground': colors.border,

            // List (for suggestion widget)
            'list.background': colors.surface,
            'list.foreground': colors.text,
            'list.hoverBackground': '#33FF3311',
            'list.hoverForeground': colors.text,
            'list.activeSelectionBackground': '#33FF3322',
            'list.activeSelectionForeground': colors.text,
            'list.inactiveSelectionBackground': '#33FF3311',
            'list.inactiveSelectionForeground': colors.text,
            'list.focusBackground': '#33FF3333',
            'list.focusForeground': colors.text,
            'list.highlightForeground': colors.retroGreen,
            'list.errorForeground': '#FF4444',
            'list.warningForeground': colors.retroAmber,

            // Input
            'input.background': colors.terminalBg,
            'input.foreground': colors.text,
            'input.border': colors.border,
            'input.placeholderForeground': colors.textMuted,
            'inputOption.activeBackground': '#33FF3322',
            'inputOption.activeBorder': colors.retroGreen,
            'inputOption.activeForeground': colors.text,
            'inputValidation.errorBackground': '#FF4444',
            'inputValidation.errorBorder': '#FF4444',
            'inputValidation.errorForeground': colors.terminalBg,
            'inputValidation.infoBackground': colors.retroCyan,
            'inputValidation.infoBorder': colors.retroCyan,
            'inputValidation.infoForeground': colors.terminalBg,
            'inputValidation.warningBackground': colors.retroAmber,
            'inputValidation.warningBorder': colors.retroAmber,
            'inputValidation.warningForeground': colors.terminalBg,

            // Dropdown
            'dropdown.background': colors.surface,
            'dropdown.border': colors.border,
            'dropdown.foreground': colors.text,
            'dropdown.listBackground': colors.surface,

            // Button
            'button.background': colors.retroGreen,
            'button.foreground': colors.terminalBg,
            'button.border': colors.retroGreen,
            'button.hoverBackground': '#44FF44',
            'button.secondaryBackground': colors.surface,
            'button.secondaryForeground': colors.text,
            'button.secondaryHoverBackground': '#2A2A2A',

            // Checkbox
            'checkbox.background': colors.terminalBg,
            'checkbox.border': colors.border,
            'checkbox.foreground': colors.retroGreen,

            // Radio
            'radio.activeBackground': colors.retroGreen,
            'radio.activeBorder': colors.retroGreen,
            'radio.activeForeground': colors.terminalBg,
            'radio.inactiveBackground': colors.terminalBg,
            'radio.inactiveBorder': colors.border,
            'radio.inactiveForeground': colors.text,
            'radio.inactiveHoverBackground': colors.surface,

            // Progress bar
            'progressBar.background': colors.retroGreen,

            // Keybinding label
            'keybindingLabel.background': colors.surface,
            'keybindingLabel.border': colors.border,
            'keybindingLabel.bottomBorder': colors.border,
            'keybindingLabel.foreground': colors.textMuted,

            // Tooltips
            'editorWidget.resizeBorder': colors.border,

            // Notifications
            'notificationCenter.border': colors.border,
            'notificationCenterHeader.background': colors.surface,
            'notificationCenterHeader.foreground': colors.textMuted,
            'notificationLink.foreground': colors.retroCyan,
            'notifications.background': colors.surface,
            'notifications.border': colors.border,
            'notifications.foreground': colors.text,
            'notificationToast.border': colors.border,

            // Window active/inactive
            'window.activeBorder': colors.retroGreen,
            'window.inactiveBorder': colors.border,

            // Git colors
            'gitDecoration.addedResourceForeground': colors.retroGreen,
            'gitDecoration.modifiedResourceForeground': colors.retroAmber,
            'gitDecoration.deletedResourceForeground': '#FF4444',
            'gitDecoration.untrackedResourceForeground': colors.retroCyan,
            'gitDecoration.ignoredResourceForeground': colors.textMuted,
            'gitDecoration.conflictingResourceForeground': colors.retroMagenta,
            'gitDecoration.submoduleResourceForeground': colors.retroCyan,

            // Debug colors
            'debugToolBar.background': colors.surface,
            'debugToolBar.border': colors.border,
            'debugExceptionWidget.background': '#FF4444',
            'debugExceptionWidget.border': '#FF4444',
            'debugTokenExpression.name': colors.retroCyan,
            'debugTokenExpression.value': colors.retroAmber,
            'debugTokenExpression.type': colors.textMuted,
            'debugView.stateLabelBackground': colors.surface,
            'debugView.valueChangedHighlight': colors.retroGreen,

            // Testing
            'testing.iconErrored': '#FF4444',
            'testing.iconFailed': '#FF4444',
            'testing.iconPassed': colors.retroGreen,
            'testing.iconQueued': colors.textMuted,
            'testing.iconSkipped': colors.textMuted,
            'testing.iconUnset': colors.textMuted,
            'testing.message.error.decorationForeground': '#FF4444',
            'testing.message.error.lineBackground': '#FF444411',
            'testing.message.hint.decorationForeground': colors.retroCyan,
            'testing.message.hint.lineBackground': '#00FFFF11',
            'testing.message.info.decorationForeground': colors.textMuted,
            'testing.message.info.lineBackground': '#88888811',
            'testing.message.warning.decorationForeground': colors.retroAmber,
            'testing.message.warning.lineBackground': '#FFB00011',
            'testing.peekBorder': colors.retroGreen,
            'testing.runAction': colors.retroGreen,

            // Welcome page
            'welcomePage.background': colors.terminalBg,
            'welcomePage.buttonBackground': colors.surface,
            'welcomePage.buttonHoverBackground': '#2A2A2A',
            'welcomePage.progress.background': colors.surface,
            'welcomePage.progress.foreground': colors.retroGreen,
            'welcomePage.tileBackground': colors.surface,
            'welcomePage.tileBorder': colors.border,
            'welcomePage.tileHoverBackground': '#2A2A2A',

            // Walk-through
            'walkThrough.embeddedEditorBackground': colors.terminalBg,

            // Settings
            'settings.checkboxBackground': colors.terminalBg,
            'settings.checkboxBorder': colors.border,
            'settings.checkboxForeground': colors.retroGreen,
            'settings.dropdownBackground': colors.surface,
            'settings.dropdownBorder': colors.border,
            'settings.dropdownForeground': colors.text,
            'settings.dropdownListBorder': colors.border,
            'settings.editableItemBackground': colors.terminalBg,
            'settings.focusedRowBackground': '#1A1A1A',
            'settings.focusedRowBorder': colors.retroGreen,
            'settings.headerBorder': colors.border,
            'settings.headerForeground': colors.text,
            'settings.modifiedItemIndicator': colors.retroGreen,
            'settings.numberInputBackground': colors.terminalBg,
            'settings.numberInputBorder': colors.border,
            'settings.numberInputForeground': colors.text,
            'settings.rowHoverBackground': '#1A1A1A',
            'settings.sashBorder': colors.border,
            'settings.settingsHeaderHoverForeground': colors.textMuted,
            'settings.textInputBackground': colors.terminalBg,
            'settings.textInputBorder': colors.border,
            'settings.textInputForeground': colors.text,

            // Problems
            'problemsErrorIcon.foreground': '#FF4444',
            'problemsInfoIcon.foreground': colors.retroCyan,
            'problemsWarningIcon.foreground': colors.retroAmber,

            // Charts
            'charts.blue': colors.retroCyan,
            'charts.foreground': colors.text,
            'charts.green': colors.retroGreen,
            'charts.lines': colors.textMuted,
            'charts.orange': colors.retroAmber,
            'charts.purple': colors.retroMagenta,
            'charts.red': '#FF4444',
            'charts.yellow': colors.retroAmber,

            // Symbols
            'symbolIcon.arrayForeground': colors.retroCyan,
            'symbolIcon.booleanForeground': colors.retroAmber,
            'symbolIcon.classForeground': colors.retroCyan,
            'symbolIcon.colorForeground': colors.retroMagenta,
            'symbolIcon.constantForeground': colors.retroAmber,
            'symbolIcon.constructorForeground': colors.retroGreen,
            'symbolIcon.enumeratorForeground': colors.retroCyan,
            'symbolIcon.fieldForeground': colors.text,
            'symbolIcon.fileForeground': colors.textMuted,
            'symbolIcon.folderForeground': colors.textMuted,
            'symbolIcon.functionForeground': colors.retroCyan,
            'symbolIcon.interfaceForeground': colors.retroCyan,
            'symbolIcon.keyForeground': colors.retroAmber,
            'symbolIcon.keywordForeground': colors.retroGreen,
            'symbolIcon.methodForeground': colors.retroCyan,
            'symbolIcon.moduleForeground': colors.text,
            'symbolIcon.namespaceForeground': colors.text,
            'symbolIcon.nullForeground': colors.textMuted,
            'symbolIcon.numberForeground': colors.retroAmber,
            'symbolIcon.objectForeground': colors.text,
            'symbolIcon.operatorForeground': colors.text,
            'symbolIcon.packageForeground': colors.textMuted,
            'symbolIcon.propertyForeground': colors.text,
            'symbolIcon.referenceForeground': colors.textMuted,
            'symbolIcon.snippetForeground': colors.retroCyan,
            'symbolIcon.stringForeground': colors.retroAmber,
            'symbolIcon.structForeground': colors.retroCyan,
            'symbolIcon.textForeground': colors.text,
            'symbolIcon.typeParameterForeground': colors.retroCyan,
            'symbolIcon.unitForeground': colors.textMuted,
            'symbolIcon.variableForeground': colors.text,

            // Terminal
            'terminal.ansiBlack': '#000000',
            'terminal.ansiBlue': '#0000FF',
            'terminal.ansiBrightBlack': '#666666',
            'terminal.ansiBrightBlue': '#6666FF',
            'terminal.ansiBrightCyan': colors.retroCyan,
            'terminal.ansiBrightGreen': colors.retroGreen,
            'terminal.ansiBrightMagenta': colors.retroMagenta,
            'terminal.ansiBrightRed': '#FF4444',
            'terminal.ansiBrightWhite': '#FFFFFF',
            'terminal.ansiBrightYellow': colors.retroAmber,
            'terminal.ansiCyan': '#00FFFF',
            'terminal.ansiGreen': '#33FF33',
            'terminal.ansiMagenta': '#FF00FF',
            'terminal.ansiRed': '#FF0000',
            'terminal.ansiWhite': '#FFFFFF',
            'terminal.ansiYellow': '#FFB000',
            'terminal.background': colors.terminalBg,
            'terminal.border': colors.border,
            'terminal.dropBackground': '#33FF3322',
            'terminal.foreground': colors.retroGreen,
            'terminal.selectionBackground': '#33FF3333',
            'terminal.tab.activeBorder': colors.retroGreen,
            'terminalCursor.background': colors.terminalBg,
            'terminalCursor.foreground': colors.retroGreen,
        },
    });
}

export { colors };
