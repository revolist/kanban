import { describe, expect, it } from 'vitest';
import { displayKanbanEditorFieldValue, parseKanbanEditorFieldValue } from './kanban-card-editor-dialog.utils';

describe('Kanban editor date controls', () => {
  it('displays instants in the configured card timezone', () => {
    expect(
      displayKanbanEditorFieldValue('2026-08-12T23:30:00.000Z', { id: 'start', kind: 'datetime' }, 'Europe/Warsaw'),
    ).toBe('2026-08-13T01:30');
    expect(
      displayKanbanEditorFieldValue('2026-08-12T01:30:00.000Z', { id: 'due', kind: 'date' }, 'America/New_York'),
    ).toBe('2026-08-11');
  });
  it.each(['UTC', 'Europe/Lisbon', 'Europe/Warsaw', 'America/New_York', 'Pacific/Honolulu'])(
    'preserves date-only controls in %s',
    (zone) => {
      expect(displayKanbanEditorFieldValue('2026-08-12', { id: 'due', kind: 'date' }, zone)).toBe('2026-08-12');
    },
  );
});

describe('Kanban date storage round trips', () => {
  it.each(['UTC', 'Europe/Lisbon', 'Europe/Warsaw', 'America/New_York', 'Pacific/Honolulu'])(
    'preserves values and types in %s',
    (zone) => {
      for (const kind of ['date', 'datetime'] as const) {
        for (const original of [
          '2026-08-12',
          '2026-08-12T23:30:45.123Z',
          new Date('2026-08-12T23:30:45.123Z'),
          Date.parse('2026-08-12T23:30:45.123Z'),
        ]) {
          const field = { id: 'due', kind };
          expect(
            parseKanbanEditorFieldValue(displayKanbanEditorFieldValue(original, field, zone), field, original, zone),
          ).toBe(original);
        }
      }
    },
  );
  it('edits in the configured timezone and retains Date and numeric representations', () => {
    const field = { id: 'start', kind: 'datetime' as const };
    expect(parseKanbanEditorFieldValue('2026-08-13T01:30', field, '2026-08-12T10:00:00.000Z', 'Europe/Warsaw')).toBe(
      '2026-08-12T23:30:00.000Z',
    );
    expect(parseKanbanEditorFieldValue('2026-08-13T01:30', field, new Date(0), 'Europe/Warsaw')).toEqual(
      new Date('2026-08-12T23:30Z'),
    );
    expect(parseKanbanEditorFieldValue('2026-08-13T01:30', field, 0, 'Europe/Warsaw')).toBe(
      Date.parse('2026-08-12T23:30Z'),
    );
  });
  it('retains a repeated hour and its sub-minute precision; does not normalize a DST gap', () => {
    const field = { id: 'start', kind: 'datetime' as const };
    const original = '2026-11-01T06:30:45.123Z';
    expect(parseKanbanEditorFieldValue('2026-11-01T01:30', field, original, 'America/New_York')).toBe(original);
    expect(parseKanbanEditorFieldValue('2026-03-08T02:30', field, original, 'America/New_York')).toBe(
      '2026-03-08T02:30',
    );
  });
});

it('keeps a rejected DST-gap input visible for correction', () => {
  expect(displayKanbanEditorFieldValue('2026-03-29T02:30', { id: 'start', kind: 'datetime' }, 'Europe/Warsaw')).toBe(
    '2026-03-29T02:30',
  );
});

it('keeps true calendar dates valid on a day whose zoned midnight is skipped', () => {
  const field = { id: 'dueDate', kind: 'date' as const };
  for (const original of [undefined, '2018-11-03']) {
    expect(parseKanbanEditorFieldValue('2018-11-04', field, original, 'America/Sao_Paulo')).toBe('2018-11-04');
  }
});
it('preserves instant types when editing a skipped-midnight date', () => {
  const field = { id: 'dueDate', kind: 'date' as const };
  const iso = '2018-11-04T12:30:45.123Z';
  for (const original of [new Date(iso), Date.parse(iso), iso]) {
    expect(parseKanbanEditorFieldValue('2018-11-04', field, original, 'America/Sao_Paulo')).toBe(original);
    const next = parseKanbanEditorFieldValue('2018-11-05', field, original, 'America/Sao_Paulo');
    expect(next instanceof Date ? 'Date' : typeof next).toBe(original instanceof Date ? 'Date' : typeof original);
    expect(new Date(next as string | number).toISOString()).toBe('2018-11-05T02:00:00.000Z');
  }
});
