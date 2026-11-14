import { syncKanbanTheme } from '../theme.js';
import { sameEditorDraft, createEditorPatch } from './draft.js';
/** @jsxImportSource preact */
import { h, type ComponentChildren } from 'preact';
import { renderPreactInto } from '@revolist/ui/preact-mount';
import { CorePlugin, bindObservableProp } from '@revolist/grid-runtime';
import type { DataType, PluginProviders } from '@revolist/revogrid';
import { createKanbanCardId } from '../../core/card-id.js';
import { KanbanCardEditorDialog } from './kanban-card-editor-dialog.js';
import { parseKanbanEditorFieldValue } from './kanban-card-editor-dialog.utils.js';
import { validateKanbanCardEditor } from './kanban-card-editor-validation.js';
import type { KanbanCardId, KanbanMutationResult } from '../../types.js';
import type {
  KanbanCardEditorDialogOptions,
  KanbanCardEditorDraftController,
  KanbanCardEditorDraftState,
  KanbanCardEditorField,
  KanbanCardEditorFieldContext,
  KanbanCardEditorRendererLifecycle,
  KanbanCardEditorLabels,
  KanbanCardEditorOpenRequest,
  KanbanCardEditorValidationReason,
  KanbanCardEditorValidationResult,
  EditorRequest,
} from './kanban-card-editor-dialog.types.js';
const render = (view: ComponentChildren, host: Element) => renderPreactInto(host, view);
const KANBAN_CARD_CREATE_REQUEST_EVENT = 'kanbancardcreaterequest';
const KANBAN_CARD_EDIT_REQUEST_EVENT = 'kanbancardeditrequest';
const KANBAN_CARD_DELETE_REQUEST_EVENT = 'kanbancarddeleterequest';
export interface EditorBoard<T extends DataType> {
  getConfig(): any;
  getCards(): readonly T[];
  getProjection(): { cardById: ReadonlyMap<KanbanCardId, { card: T }> } | null;
  createCard(card: T, options?: any): KanbanMutationResult<T>;
  updateCard(id: KanbanCardId, patch: Partial<T>, options?: any): KanbanMutationResult<T>;
  deleteCards(ids: readonly KanbanCardId[], options?: any): KanbanMutationResult<T>;
}
export interface EditorContribution<T extends DataType> {
  readonly board: () => EditorBoard<T> | undefined;
  readonly options: (options: KanbanCardEditorDialogOptions<T>) => KanbanCardEditorDialogOptions<T>;
  readonly fields: (
    config: any,
    options: KanbanCardEditorDialogOptions<T>,
    cards: readonly T[],
  ) => readonly KanbanCardEditorField<T>[];
  readonly placement?: (request: EditorRequest<T>, config: any) => Partial<T>;
  readonly labels?: () => Partial<KanbanCardEditorLabels>;
}
const DEFAULT_OPTIONS: KanbanCardEditorDialogOptions = {};
const DEFAULT_LABELS: KanbanCardEditorLabels = {
  newCard: 'Create a card',
  untitledCard: 'Untitled card',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  close: 'Close editor',
  deleteConfirm: 'Delete this card?',
  discardConfirm: 'Discard your unsaved changes?',
  required: 'This field is required.',
  validationSummary: 'Please check the highlighted fields.',
};

export class KanbanEditorController<T extends DataType = DataType> extends CorePlugin {
  private readonly host: HTMLDivElement;
  private options: KanbanCardEditorDialogOptions<T> | false = DEFAULT_OPTIONS as KanbanCardEditorDialogOptions<T>;
  private state: KanbanCardEditorDraftState<T> | null = null;
  private fields: readonly KanbanCardEditorField<T>[] = [];
  private initialDraft: T | null = null;
  private cardIds: readonly KanbanCardId[] = [];
  private disposed = false;
  private generation = 0;
  private customLifecycle?: KanbanCardEditorRendererLifecycle<T>;

  constructor(
    revogrid: HTMLRevoGridElement,
    providers: PluginProviders,
    private readonly contribution: EditorContribution<T>,
  ) {
    super(revogrid, providers);
    this.host = revogrid.ownerDocument.createElement('div');
    this.host.className = 'kanban-card-editor-host rv-native-controls';
    syncKanbanTheme(revogrid, this.host);
    this.addEventListener('afterthemechanged', () => syncKanbanTheme(revogrid, this.host));
    revogrid.ownerDocument.body.appendChild(this.host);
    this.options = bindObservableProp<
      KanbanCardEditorDialogOptions<T> | false | undefined,
      KanbanCardEditorDialogOptions<T> | false
    >(this, {
      prop: 'kanbanCardEditorDialog',
      defaultValue: DEFAULT_OPTIONS as KanbanCardEditorDialogOptions<T>,
      map: (value) =>
        value === false
          ? false
          : this.contribution.options(value ?? (DEFAULT_OPTIONS as KanbanCardEditorDialogOptions<T>)),
      apply: (value) => {
        this.options = value;
        if (value === false) {
          this.forceClose();
        } else {
          this.renderEditor();
        }
      },
    });
    this.addRequestListener(KANBAN_CARD_CREATE_REQUEST_EVENT, (detail) => this.openCreate(detail));
    this.addRequestListener(KANBAN_CARD_EDIT_REQUEST_EVENT, (detail) => this.openEdit(detail));
    this.addRequestListener(KANBAN_CARD_DELETE_REQUEST_EVENT, (detail) => this.deleteRequest(detail));
  }

  open(request: KanbanCardEditorOpenRequest<T>): void {
    if (this.disposed || this.options === false) {
      return;
    }
    if (request.mode === 'create') {
      void this.openCreate(request.request ?? request);
    } else {
      this.openEdit(request.request ?? request);
    }
  }

  close(): void {
    void this.requestClose();
  }

  async validate(): Promise<KanbanCardEditorValidationResult> {
    const draft = this.state?.draft;
    const result = await this.runValidation('manual');
    if (this.state && this.state.draft === draft) {
      this.state = { ...this.state, errors: result.errors };
      this.renderEditor();
    }
    return result;
  }

  override destroy(): void {
    this.disposed = true;
    this.forceClose();
    this.host.remove();
    super.destroy();
  }

  private get kanban(): EditorBoard<T> | undefined {
    return this.contribution.board();
  }

  private addRequestListener(eventName: string, action: (detail: EditorRequest<T>) => void | Promise<void>): void {
    this.addEventListener(eventName, (event) => {
      queueMicrotask(() => {
        if (!this.disposed && !event.defaultPrevented && this.options !== false) {
          void action(event.detail as EditorRequest<T>);
        }
      });
    });
  }

  private async openCreate(request: EditorRequest<T>): Promise<void> {
    const kanban = this.kanban;
    const config = kanban?.getConfig();
    if (!kanban || !config || this.options === false) {
      return;
    }
    const generation = ++this.generation;
    const options = this.options;
    try {
      const cardId = await (options.createCardId?.({
        grid: this.revogrid,
        cards: kanban.getCards(),
      }) ?? createKanbanCardId(kanban.getCards(), config.idField));
      if (this.disposed || generation !== this.generation) {
        return;
      }
      const draft = { [config.idField]: cardId } as DataType;
      if (request.columnProp !== undefined) {
        draft[config.columnField] = request.columnProp;
      } else if (config.columns[0]) {
        draft[config.columnField] = config.columns[0].prop;
      }
      Object.assign(draft, this.contribution.placement?.(request, config));
      this.fields = this.contribution.fields(config, this.options, kanban.getCards());
      for (const field of this.fields) {
        if (field.field === undefined || draft[field.field] !== undefined || field.defaultValue === undefined) {
          continue;
        }
        const base = {
          grid: this.revogrid,
          mode: 'create' as const,
          card: null,
          draft,
        };
        draft[field.field] = typeof field.defaultValue === 'function' ? field.defaultValue(base) : field.defaultValue;
      }
      Object.assign(draft, (await options.createDraft?.({ grid: this.revogrid, request })) ?? {});
      if (this.disposed || generation !== this.generation) {
        return;
      }
      this.cardIds = [cardId];
      this.openState('create', null, draft as T);
    } catch (error) {
      if (!this.disposed && generation === this.generation) {
        this.fields = [];
        this.cardIds = [];
        this.openState('create', null, {} as T, { _form: errorMessage(error) }, true);
      }
    }
  }

  private openEdit(request: EditorRequest<T>): void {
    const kanban = this.kanban;
    const config = kanban?.getConfig();
    const card =
      request.card ??
      (request.cardId === undefined ? undefined : kanban?.getProjection()?.cardById.get(request.cardId)?.card);
    if (!kanban || !config || !card || this.options === false) {
      return;
    }
    const cardId = request.cardId ?? request.cardIds?.[0];
    if (cardId === undefined) {
      return;
    }
    this.fields = this.contribution.fields(config, this.options, kanban.getCards());
    this.cardIds = request.cardIds?.length ? request.cardIds : [cardId];
    this.openState('edit', card, { ...card } as T);
  }

  private openState(
    mode: 'create' | 'edit',
    card: T | null,
    draft: T,
    errors: Readonly<Record<string, string>> = {},
    blocked = false,
  ): void {
    this.generation++;
    this.initialDraft = { ...draft } as T;
    this.state = {
      mode,
      card,
      draft,
      dirty: false,
      pending: false,
      errors,
      blocked,
    };
    this.renderEditor();
  }

  private setValue(field: KanbanCardEditorField<T>, input: unknown): void {
    if (!this.state) {
      return;
    }
    const context = this.fieldContext(field);
    // Invalid/cleared control values belong to the draft; storage policy belongs to the initial value.
    const initialDraft = this.initialDraft ?? this.state.draft;
    const original =
      field.parse === undefined && (field.kind === 'date' || field.kind === 'datetime')
        ? (field.read?.(initialDraft, { ...context, draft: initialDraft }) ??
          (field.field === undefined ? undefined : initialDraft[field.field]))
        : undefined;
    const value =
      field.parse === undefined
        ? parseKanbanEditorFieldValue(input, field, original, this.kanban?.getConfig()?.card.dateTimeZone)
        : field.parse(input, context);
    const patch =
      field.write?.(value, this.state.draft, context) ??
      (field.field === undefined ? {} : ({ [field.field]: value } as Partial<T>));
    const draft = { ...this.state.draft, ...patch } as T;
    this.state = {
      ...this.state,
      draft,
      dirty: !sameEditorDraft(draft, this.initialDraft),
      errors: withoutKey(this.state.errors, field.id),
    };
    this.renderEditor();
  }

  private setDraft(patch: Partial<T>): void {
    if (!this.state) {
      return;
    }
    const draft = { ...this.state.draft, ...patch } as T;
    this.state = {
      ...this.state,
      draft,
      dirty: !sameEditorDraft(draft, this.initialDraft),
    };
    this.renderEditor();
  }

  private async submit(): Promise<void> {
    const state = this.state;
    const kanban = this.kanban;
    const config = kanban?.getConfig();
    if (!state || !kanban || !config || this.options === false || state.pending || state.blocked) {
      return;
    }
    const generation = this.generation;
    const options = this.options;
    const cardId = this.cardIds[0];
    this.state = { ...state, pending: true, errors: {} };
    this.renderEditor();
    const validation = await this.runValidation('submit');
    if (!this.state || this.generation !== generation) {
      return;
    }
    if (this.state.draft !== state.draft) {
      this.state = { ...this.state, pending: false };
      this.renderEditor();
      return;
    }
    if (!validation.valid) {
      this.state = { ...this.state, pending: false, errors: validation.errors };
      this.renderEditor();
      return;
    }
    try {
      const handled = await options.onSubmit?.({
        grid: this.revogrid,
        mode: state.mode,
        card: state.card,
        draft: state.draft,
      });
      if (!this.state || this.generation !== generation) {
        return;
      }
      if (this.state.draft !== state.draft) {
        this.state = { ...this.state, pending: false };
        this.renderEditor();
        return;
      }
      if (handled === false) {
        this.forceClose();
        return;
      }
      const result =
        state.mode === 'create'
          ? kanban.createCard(state.draft, { reason: 'editor' })
          : kanban.updateCard(cardId, createEditorPatch(state.draft, state.card, config.idField, config.orderField), {
              reason: 'editor',
            });
      if (!result.ok) {
        this.state = {
          ...this.state!,
          pending: false,
          errors: { _form: result.reason },
        };
        this.renderEditor();
        return;
      }
      this.forceClose();
    } catch (error) {
      if (!this.state || this.generation !== generation) {
        return;
      }
      this.state = {
        ...this.state!,
        pending: false,
        errors: { _form: errorMessage(error) },
      };
      this.renderEditor();
    }
  }

  private runValidation(reason: KanbanCardEditorValidationReason): Promise<KanbanCardEditorValidationResult> {
    if (!this.state || this.options === false) {
      return Promise.resolve({ valid: false, cancelled: true, errors: {} });
    }
    return validateKanbanCardEditor({
      grid: this.revogrid,
      mode: this.state.mode,
      card: this.state.card,
      draft: this.state.draft,
      fields: this.fields,
      reason,
      requiredMessage: this.labels.required,
      validateForm: this.options.validate,
      emit: (eventName, detail) => this.emit(eventName, detail),
    });
  }

  private async deleteRequest(detail: EditorRequest<T>): Promise<void> {
    const ids = detail.cardIds?.length ? detail.cardIds : detail.cardId === undefined ? [] : [detail.cardId];
    if (ids.length) {
      await this.performDelete(ids, detail.cards ?? (detail.card ? [detail.card] : []));
    }
  }

  private async deleteCurrent(): Promise<void> {
    if (!this.state || this.state.mode !== 'edit') {
      return;
    }
    await this.performDelete(this.cardIds, this.state.card ? [this.state.card] : []);
  }

  private async performDelete(cardIds: readonly KanbanCardId[], cards: readonly T[]): Promise<void> {
    if (this.options === false || !this.kanban || this.state?.pending) {
      return;
    }
    const generation = this.generation;
    const current = () => !this.disposed && this.generation === generation;
    const context = { grid: this.revogrid, cards, cardIds };
    try {
      const confirmOption = this.options.confirmDelete;
      const confirmed =
        typeof confirmOption === 'function'
          ? await confirmOption(context)
          : confirmOption === false
            ? true
            : (this.revogrid.ownerDocument.defaultView?.confirm(this.labels.deleteConfirm) ?? false);
      if (!confirmed || !current()) {
        return;
      }
      if (this.state) {
        this.state = { ...this.state, pending: true };
        this.renderEditor();
      }
      const handled = await this.options.onDelete?.(context);
      if (!current()) {
        return;
      }
      if (handled === false) {
        this.forceClose();
        return;
      }
      const result = this.kanban.deleteCards(cardIds, { reason: 'editor' });
      if (result.ok) {
        this.forceClose();
      } else if (this.state) {
        this.state = {
          ...this.state,
          pending: false,
          errors: { _form: result.reason },
        };
        this.renderEditor();
      }
    } catch (error) {
      if (this.state && current()) {
        this.state = {
          ...this.state,
          pending: false,
          errors: { _form: errorMessage(error) },
        };
        this.renderEditor();
      }
    }
  }

  private async requestClose(): Promise<void> {
    const generation = this.generation;
    if (!this.state || this.state.pending) {
      return;
    }
    if (this.state.dirty && this.options !== false) {
      const option = this.options.confirmDiscard;
      const confirmed =
        typeof option === 'function'
          ? await option(this.state)
          : option === false
            ? true
            : (this.revogrid.ownerDocument.defaultView?.confirm(this.labels.discardConfirm) ?? false);
      if (!confirmed) {
        return;
      }
    }
    if (generation === this.generation) {
      this.forceClose();
    }
  }

  private forceClose(): void {
    this.generation++;
    this.customLifecycle?.destroy?.();
    this.customLifecycle = undefined;
    render(null, this.host);
    this.state = null;
    this.initialDraft = null;
    this.cardIds = [];
  }

  private renderEditor(): void {
    if (!this.state || this.options === false) {
      render(null, this.host);
      return;
    }
    const custom = this.options.customization?.editor;
    if (custom) {
      render(null, this.host);
      const context = this.rendererContext();
      if (!this.customLifecycle) {
        this.customLifecycle = custom.mount(this.host, context) ?? undefined;
      } else {
        this.customLifecycle.update?.(context);
      }
      return;
    }
    this.customLifecycle?.destroy?.();
    this.customLifecycle = undefined;
    render(
      <KanbanCardEditorDialog
        grid={this.revogrid}
        dateTimeZone={this.kanban?.getConfig()?.card.dateTimeZone}
        fields={this.fields}
        state={this.state}
        labels={this.labels}
        onValue={(field, value) => this.setValue(field, value)}
        onClose={() => {
          void this.requestClose();
        }}
        onSubmit={() => {
          void this.submit();
        }}
        onDelete={() => {
          void this.deleteCurrent();
        }}
      />,
      this.host,
    );
  }

  private rendererContext() {
    return {
      grid: this.revogrid,
      open: true,
      fields: this.fields,
      state: this.state!,
      controller: this.controller,
    };
  }

  private get controller(): KanbanCardEditorDraftController<T> {
    return {
      getState: () => this.state!,
      setValue: (id, value) => {
        const field = this.fields.find((item) => item.id === id);
        if (field) {
          this.setValue(field, value);
        }
      },
      setDraft: (patch) => this.setDraft(patch),
      setErrors: (errors) => {
        if (this.state) {
          this.state = { ...this.state, errors };
          this.renderEditor();
        }
      },
      reset: () => {
        if (this.state && this.initialDraft) {
          this.state = {
            ...this.state,
            draft: { ...this.initialDraft } as T,
            dirty: false,
            errors: {},
          };
          this.renderEditor();
        }
      },
      close: () => {
        void this.requestClose();
      },
      validate: () => this.validate(),
      submit: () => {
        void this.submit();
      },
      delete: () => {
        void this.deleteCurrent();
      },
    };
  }

  private fieldContext(field: KanbanCardEditorField<T>): KanbanCardEditorFieldContext<T> {
    return {
      grid: this.revogrid,
      mode: this.state!.mode,
      card: this.state!.card,
      draft: this.state!.draft,
      field,
    };
  }

  private get labels(): KanbanCardEditorLabels {
    return {
      ...DEFAULT_LABELS,
      ...this.contribution.labels?.(),
      ...(this.options === false ? {} : this.options.labels),
    };
  }
}

function withoutKey(record: Readonly<Record<string, string>>, key: string): Record<string, string> {
  const next = { ...record };
  delete next[key];
  return next;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
