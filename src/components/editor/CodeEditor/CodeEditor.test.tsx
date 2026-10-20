/**
 * CodeEditor Component Tests
 *
 * Monaco itself is replaced by a stub that exposes the props the component
 * passes, so the tests cover the component's own behaviour: it is controlled,
 * and keyboard shortcuts use the latest callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

type Command = () => void;
const registered: Command[] = [];
let lastProps: { value?: string; onChange?: (v: string | undefined) => void; options?: { readOnly?: boolean } } = {};

vi.mock('./monacoSetup', () => ({}));

vi.mock('@monaco-editor/react', () => ({
    default: (props: {
        value?: string;
        onChange?: (v: string | undefined) => void;
        onMount?: (editor: unknown, monaco: unknown) => void;
        options?: { readOnly?: boolean };
    }) => {
        lastProps = props;
        if (props.onMount && registered.length === 0) {
            const editor = { addCommand: (_keys: number, fn: Command) => registered.push(fn) };
            const monaco = { KeyMod: { CtrlCmd: 2048 }, KeyCode: { Enter: 3, KeyS: 49 } };
            props.onMount(editor, monaco);
        }
        return <div data-testid="monaco" data-value={props.value} />;
    },
}));

vi.mock('@/stores/settingsStore', () => ({
    useSettingsStore: (selector: (s: { fontSize: number }) => unknown) => selector({ fontSize: 14 }),
}));

import { CodeEditor } from './CodeEditor';

describe('CodeEditor', () => {
    beforeEach(() => {
        registered.length = 0;
        lastProps = {};
    });

    it('shows the value it is given', () => {
        render(<CodeEditor value="program A; begin end." onChange={() => undefined} />);
        expect(screen.getByTestId('monaco').dataset['value']).toBe('program A; begin end.');
    });

    it('reports edits to the parent', () => {
        const onChange = vi.fn();
        render(<CodeEditor value="" onChange={onChange} />);
        act(() => lastProps.onChange?.('program B;'));
        expect(onChange).toHaveBeenCalledWith('program B;');
        act(() => lastProps.onChange?.(undefined));
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('runs the latest onRun callback from the keyboard shortcut', () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = render(<CodeEditor value="" onChange={() => undefined} onRun={first} />);
        rerender(<CodeEditor value="changed" onChange={() => undefined} onRun={second} />);
        act(() => registered[0]?.());
        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledTimes(1);
    });

    it('calls onSave for the save shortcut', () => {
        const onSave = vi.fn();
        render(<CodeEditor value="" onChange={() => undefined} onSave={onSave} />);
        act(() => registered[1]?.());
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('passes read-only mode to Monaco', () => {
        render(<CodeEditor value="" onChange={() => undefined} readOnly />);
        expect(lastProps.options?.readOnly).toBe(true);
    });
});
