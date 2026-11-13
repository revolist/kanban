import { parseKanbanEditorFieldValue, displayKanbanEditorFieldValue } from './kanban-card-editor-dialog.utils';
import { describe, expect, it, vi } from 'vitest';
import type {
  KanbanCardEditorBeforeFieldValidationDetail,
  KanbanCardEditorValidationStartDetail,
} from './kanban-card-editor-dialog.types';
import {
  BEFORE_KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT,
  BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT,
  KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT,
  KANBAN_CARD_EDITOR_INVALID_EVENT,
  KANBAN_CARD_EDITOR_VALIDATE_EVENT,
  validateKanbanCardEditor,
} from './kanban-card-editor-validation';

describe('Kanban card editor validation', () => {
  const grid = {} as HTMLRevoGridElement;

  it('validates required, hidden, synchronous, asynchronous, and form-level rules', async () => {
    const events: Array<{ name: string; detail: any }> = [];
    const asyncValidator = vi.fn(async () => 'Async error');
    const result = await validateKanbanCardEditor({
      grid,
      mode: 'create',
      card: null,
      draft: { title: '', hidden: '', sync: 1, async: 2, okay: 'yes' },
      fields: [
        { id: 'title', field: 'title', required: true },
        { id: 'hidden', field: 'hidden', required: true, hidden: true },
        { id: 'sync', field: 'sync', validate: () => 'Sync error' },
        { id: 'async', field: 'async', validate: asyncValidator },
        { id: 'okay', field: 'okay' },
      ],
      reason: 'submit',
      requiredMessage: 'Required',
      validateForm: async () => ({ _form: 'Form error' }),
      emit: (name, detail) => {
        events.push({ name, detail });
        return { defaultPrevented: false };
      },
    });

    expect(result).toEqual({
      valid: false,
      cancelled: false,
      errors: {
        title: 'Required',
        sync: 'Sync error',
        async: 'Async error',
        _form: 'Form error',
      },
    });
    expect(asyncValidator).toHaveBeenCalledOnce();
    expect(
      events
        .filter(({ name }) => name === KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT)
        .map(({ detail }) => [detail.field.id, detail.status]),
    ).toEqual([
      ['title', 'invalid'],
      ['hidden', 'skipped'],
      ['sync', 'invalid'],
      ['async', 'invalid'],
      ['okay', 'valid'],
    ]);
    expect(events.at(-2)?.name).toBe(KANBAN_CARD_EDITOR_VALIDATE_EVENT);
    expect(events.at(-1)?.name).toBe(KANBAN_CARD_EDITOR_INVALID_EVENT);
  });

  it('accepts host errors and reports cancellation without running field validators', async () => {
    const fieldValidator = vi.fn();
    const eventNames: string[] = [];
    const result = await validateKanbanCardEditor({
      grid,
      mode: 'edit',
      card: { value: 'old' },
      draft: { value: 'new' },
      fields: [{ id: 'value', field: 'value', validate: fieldValidator }],
      reason: 'manual',
      requiredMessage: 'Required',
      emit: (name, detail) => {
        eventNames.push(name);
        if (name === BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT) {
          (detail as KanbanCardEditorValidationStartDetail).setError('external', 'External error');
        }
        if (name === BEFORE_KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT) {
          const fieldDetail = detail as KanbanCardEditorBeforeFieldValidationDetail;
          fieldDetail.setError('Host field error');
          expect(fieldDetail.error).toBe('Host field error');
          return { defaultPrevented: true };
        }
        return { defaultPrevented: false };
      },
    });

    expect(result).toEqual({
      valid: false,
      cancelled: true,
      errors: { external: 'External error', value: 'Host field error' },
    });
    expect(fieldValidator).not.toHaveBeenCalled();
    expect(eventNames).toEqual([
      BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT,
      BEFORE_KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT,
      KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT,
      KANBAN_CARD_EDITOR_VALIDATE_EVENT,
      KANBAN_CARD_EDITOR_INVALID_EVENT,
    ]);
  });

  it('turns thrown field and form validators into rendered validation errors', async () => {
    const result = await validateKanbanCardEditor({
      grid,
      mode: 'edit',
      card: { first: 1, second: 2 },
      draft: { first: 1, second: 2 },
      fields: [
        {
          id: 'first',
          field: 'first',
          hidden: () => {
            throw new Error('Visibility failed');
          },
        },
        {
          id: 'second',
          field: 'second',
          validate: () => {
            throw new Error('Field failed');
          },
        },
      ],
      reason: 'submit',
      requiredMessage: 'Required',
      validateForm: () => {
        throw new Error('Form failed');
      },
      emit: () => ({ defaultPrevented: false }),
    });

    expect(result).toEqual({
      valid: false,
      cancelled: false,
      errors: {
        first: 'Visibility failed',
        second: 'Field failed',
        _form: 'Form failed',
      },
    });
  });

  it('stops before field validation when the start event is cancelled', async () => {
    const fieldValidator = vi.fn();
    const validateForm = vi.fn();
    const events: string[] = [];
    const result = await validateKanbanCardEditor({
      grid,
      mode: 'create',
      card: null,
      draft: { title: 'Card' },
      fields: [{ id: 'title', field: 'title', validate: fieldValidator }],
      reason: 'submit',
      requiredMessage: 'Required',
      validateForm,
      emit: (name) => {
        events.push(name);
        return {
          defaultPrevented: name === BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT,
        };
      },
    });

    expect(result).toEqual({ valid: false, cancelled: true, errors: {} });
    expect(fieldValidator).not.toHaveBeenCalled();
    expect(validateForm).not.toHaveBeenCalled();
    expect(events).toEqual([
      BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT,
      KANBAN_CARD_EDITOR_VALIDATE_EVENT,
      KANBAN_CARD_EDITOR_INVALID_EVENT,
    ]);
  });
});

it.each(['2026-02-30', 'not-a-date', '2026-02-30T12:00:00Z'])('rejects invalid calendar input %s', async (dueDate) => {
  const result = await validateKanbanCardEditor({
    grid: {} as HTMLRevoGridElement,
    mode: 'edit',
    card: null,
    draft: { dueDate },
    fields: [{ id: 'due', field: 'dueDate', kind: 'date' }],
    reason: 'submit',
    requiredMessage: 'Required',
    emit: () => ({ defaultPrevented: false }),
  });
  expect(result.valid).toBe(false);
  expect(result.errors.due).toBeTruthy();
});

describe('instant-backed date controls at skipped local midnight', () => {
  for (const [zone, skippedDay, originalIso] of [
    ['America/Sao_Paulo', '2018-11-04', '2018-11-03T12:30:45.123Z'],
    ['Pacific/Apia', '2011-12-30', '2011-12-29T12:30:45.123Z'],
  ]) {
    it.each(['Date', 'number', 'string'])(
      'rejects %s edits in ' + zone + ' without losing the control day',
      async (representation) => {
        const original =
          representation === 'Date'
            ? new Date(originalIso)
            : representation === 'number'
              ? Date.parse(originalIso)
              : originalIso;
        const field = {
          id: 'dueDate',
          field: 'dueDate',
          kind: 'date' as const,
        };
        const edited = parseKanbanEditorFieldValue(skippedDay, field, original, zone);
        const result = await validateKanbanCardEditor({
          grid: {} as HTMLRevoGridElement,
          mode: 'edit',
          card: { dueDate: original },
          draft: { dueDate: edited },
          fields: [field],
          reason: 'submit',
          requiredMessage: 'Required',
          emit: () => ({ defaultPrevented: false }),
        });
        expect(result.valid).toBe(false);
        expect(result.errors.dueDate).toBe('Enter a valid date.');
        expect(displayKanbanEditorFieldValue(edited, field, zone)).toBe(skippedDay);
      },
    );
  }
});
