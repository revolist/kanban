/** @jsxImportSource preact */
import { h, type ComponentChildren } from 'preact';
import { renderPreactInto } from '@revolist/ui/preact-mount';
const render = (view: ComponentChildren, host: Element): void => renderPreactInto(host, view);
import { CorePlugin, bindObservableProp } from '@revolist/grid-runtime';
import type { DataType, PluginProviders, ColumnProp } from '@revolist/revogrid';
import { Input, TextArea, Select, ButtonControl } from '@revolist/ui/native-control';
import { DialogForm, DialogBody, DialogActionFooter } from '@revolist/ui/dialog/dialog.parts';
import { KanbanPlugin } from './plugin.js';
import { createKanbanCardId } from './core/index.js';
import { resolveKanbanLabels } from './labels.js';
import type { KanbanCardId, KanbanConfig } from './types.js';
export interface KanbanCardEditorField {
  readonly prop: ColumnProp;
  readonly label?: string;
  readonly kind?: 'text' | 'textarea' | 'number' | 'select';
  readonly required?: boolean;
  readonly options?: readonly { value: string | number; label: string }[];
}
export interface KanbanCardEditorDialogOptions<T extends DataType = DataType> {
  readonly fields?: readonly KanbanCardEditorField[];
  readonly validate?: (draft: T) => string | undefined | Promise<string | undefined>;
}
export interface KanbanEditorConfigRegistry {
  community: KanbanCardEditorDialogOptions<any>;
}
export type KanbanEditorHostConfig = KanbanEditorConfigRegistry[keyof KanbanEditorConfigRegistry];
declare global {
  interface HTMLRevoGridElement {
    kanbanCardEditorDialog?: KanbanEditorHostConfig | false;
    'kanban-card-editor-dialog'?: KanbanEditorHostConfig | false;
  }
}
declare module '@revolist/revogrid' {
  interface AdditionalData {
    kanbanCardEditorDialog?: KanbanEditorHostConfig | false;
  }
}
export class KanbanCardEditorDialogPlugin<T extends DataType = DataType> extends CorePlugin {
  private communityEditorHost!: HTMLDivElement;
  private communityOwnsEditor = false;
  private communityDraft: T | null = null;
  private communityEditingId?: KanbanCardId;
  private communityError = '';
  private communityBusy = false;
  private communityEpoch = 0;
  private communityOptions: KanbanCardEditorDialogOptions<T> | false | undefined;
  private communityReturnFocus?: HTMLElement;
  private communityBoard?: KanbanPlugin<T>;
  constructor(
    grid: HTMLRevoGridElement,
    providers: PluginProviders,
    board?: KanbanPlugin<T>,
    options: { readonly externalEditor?: boolean } = {},
  ) {
    super(grid, providers);
    if (options.externalEditor) {
      return;
    }
    this.communityOwnsEditor = true;
    this.communityBoard = board;
    this.communityEditorHost = grid.ownerDocument.createElement('div');
    this.communityEditorHost.className = 'rv-native-controls';
    grid.ownerDocument.body.append(this.communityEditorHost);
    this.communityOptions = bindObservableProp<KanbanCardEditorDialogOptions<T> | false | undefined>(this, {
      prop: 'kanbanCardEditorDialog',
      apply: (options) => {
        this.communityOptions = options;
        if (options === false) {
          this.close();
        }
      },
    });
    this.addEventListener('kanbancardcreaterequest', (event) => {
      if (event.defaultPrevented) {
        return;
      }
      const detail = event.detail as { columnProp?: ColumnProp; card?: T };
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          this.communityOpenCreate(detail);
        }
      });
    });
    this.addEventListener('kanbancardeditrequest', (event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          this.communityOpenEdit((event.detail as { cardId: KanbanCardId }).cardId);
        }
      });
    });
    this.addEventListener('kanbancarddeleterequest', (event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented) {
          this.board?.deleteCards((event.detail as { cardIds: KanbanCardId[] }).cardIds, { reason: 'editor' });
        }
      });
    });
  }
  private get board(): KanbanPlugin<T> | undefined {
    return this.communityBoard ?? (this.providers.plugins.getByClass(KanbanPlugin) as KanbanPlugin<T> | undefined);
  }
  open(request: { mode: 'create' | 'edit'; cardId?: KanbanCardId; card?: T; columnProp?: ColumnProp }): void {
    if (request.mode === 'create') {
      this.communityOpenCreate(request);
    } else if (request.cardId !== undefined) {
      this.communityOpenEdit(request.cardId);
    }
  }
  private communityOpenCreate(detail: { columnProp?: ColumnProp; card?: T } = {}): void {
    if (this.communityOptions === false || !this.board?.canCreateCard()) {
      return;
    }
    const config = this.board.getConfig() as KanbanConfig<T>;
    const idField = config.fields?.id ?? config.idField ?? 'id';
    const columnField = config.fields?.status ?? config.columnField ?? 'status';
    this.communityEditingId = undefined;
    this.communityDraft = {
      ...detail.card,
      [idField]: createKanbanCardId(this.board.getCards(), idField),
      [columnField]: detail.columnProp ?? detail.card?.[columnField] ?? config.columns?.[0]?.prop,
    } as T;
    this.communityShow();
  }
  private communityOpenEdit(id: KanbanCardId): void {
    if (this.communityOptions === false || !this.board?.canEditCard(id)) {
      return;
    }
    const projected = this.board.getProjection()?.cardById.get(id);
    if (!projected) {
      return;
    }
    this.communityEditingId = id;
    this.communityDraft = { ...projected.card };
    this.communityShow();
  }
  private communityShow(): void {
    this.communityEpoch++;
    this.communityEditorHost.dataset.theme = this.revogrid.getAttribute('theme')?.includes('dark') ? 'dark' : 'light';
    this.communityError = '';
    this.communityReturnFocus = this.revogrid.ownerDocument.activeElement as HTMLElement;
    this.communityDraw();
    const dialog = this.communityEditorHost.querySelector('dialog');
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('input')?.focus();
  }
  close(): void {
    this.communityEpoch++;
    this.communityDraft = null;
    this.communityBusy = false;
    render(null, this.communityEditorHost);
    this.communityReturnFocus?.focus({ preventScroll: true });
  }
  private async communitySubmit(): Promise<void> {
    if (!this.communityDraft || !this.board || this.communityBusy) {
      return;
    }
    const epoch = this.communityEpoch;
    const draft = { ...this.communityDraft };
    this.communityBusy = true;
    this.communityDraw();
    try {
      const error = this.communityOptions && (await this.communityOptions.validate?.(draft));
      if (epoch !== this.communityEpoch) {
        return;
      }
      if (error) {
        this.communityError = error;
        return;
      }
      const config = this.board.getConfig() as KanbanConfig<T>;
      const idField = config.fields?.id ?? config.idField ?? 'id';
      const orderField = config.orderField ?? 'order';
      const patch = { ...draft };
      delete patch[idField];
      delete patch[orderField];
      const result =
        this.communityEditingId === undefined
          ? this.board.createCard(draft, { reason: 'editor' })
          : this.board.updateCard(this.communityEditingId, patch, { reason: 'editor' });
      if (result.ok) {
        this.close();
      } else {
        this.communityError = result.reason;
      }
    } catch (error) {
      if (epoch === this.communityEpoch) {
        this.communityError = error instanceof Error ? error.message : String(error);
      }
    } finally {
      if (epoch === this.communityEpoch) {
        this.communityBusy = false;
        this.communityDraw();
      }
    }
  }
  private communityDraw(): void {
    if (!this.communityDraft || !this.board) {
      return;
    }
    const config = this.board.getConfig() as KanbanConfig<T>;
    const labels = resolveKanbanLabels(config.labels);
    const title = config.fields?.title ?? config.card?.titleField ?? 'title';
    const description = config.card?.descriptionField ?? 'description';
    const column = config.fields?.status ?? config.columnField ?? 'status';
    const fields = (this.communityOptions && this.communityOptions.fields) || [
      { prop: title, label: labels.title, required: true },
      { prop: description, label: labels.description, kind: 'textarea' as const },
    ];
    const set = (prop: ColumnProp, value: unknown) => {
      this.communityDraft = { ...this.communityDraft, [prop]: value } as T;
    };
    render(
      <dialog
        class="rv-dialog kanban-community-editor"
        aria-label={this.communityEditingId === undefined ? labels.add : labels.edit}
        onCancel={(event) => {
          event.preventDefault();
          this.close();
        }}
      >
        <DialogForm
          onSubmit={(event) => {
            event.preventDefault();
            void this.communitySubmit();
          }}
        >
          <DialogBody>
            {fields.map((field) => (
              <label key={String(field.prop)} class="kanban-community-editor-field">
                {field.label ?? String(field.prop)}
                {field.kind === 'textarea' ? (
                  <TextArea
                    value={String(this.communityDraft![field.prop] ?? '')}
                    disabled={this.communityBusy}
                    required={field.required}
                    onInput={(event) => set(field.prop, (event.currentTarget as HTMLTextAreaElement).value)}
                  />
                ) : field.kind === 'select' ? (
                  <Select
                    value={String(this.communityDraft![field.prop] ?? '')}
                    disabled={this.communityBusy}
                    onValueChange={(value) => {
                      set(field.prop, field.options?.find((option) => String(option.value) === value)?.value ?? value);
                    }}
                  >
                    {field.options?.map((option) => (
                      <option value={String(option.value)}>{option.label}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type={field.kind === 'number' ? 'number' : 'text'}
                    value={String(this.communityDraft![field.prop] ?? '')}
                    disabled={this.communityBusy}
                    required={field.required}
                    onInput={(event) => {
                      const value = (event.currentTarget as HTMLInputElement).value;
                      set(field.prop, field.kind === 'number' && value !== '' ? Number(value) : value);
                    }}
                  />
                )}
              </label>
            ))}
            <label class="kanban-community-editor-field">
              {labels.column}
              <Select
                value={String(this.communityDraft[column] ?? '')}
                disabled={this.communityBusy}
                onValueChange={(value) => {
                  set(column, config.columns?.find((item) => String(item.prop) === value)?.prop ?? value);
                }}
              >
                {config.columns?.map((item) => (
                  <option value={String(item.prop)}>{item.name ?? String(item.prop)}</option>
                ))}
              </Select>
            </label>
            {this.communityError ? <p role="alert">{this.communityError}</p> : null}
          </DialogBody>
          <DialogActionFooter
            cancel={false}
            save={false}
            start={
              this.communityEditingId === undefined ? null : (
                <ButtonControl
                  type="button"
                  disabled={this.communityBusy}
                  onClick={() => {
                    const result = this.board!.deleteCards([this.communityEditingId!], { reason: 'editor' });
                    if (result.ok) {
                      this.close();
                    } else {
                      this.communityError = result.reason;
                      this.communityDraw();
                    }
                  }}
                >
                  {labels.delete}
                </ButtonControl>
              )
            }
          >
            <ButtonControl type="button" disabled={this.communityBusy} onClick={() => this.close()}>
              {labels.cancel}
            </ButtonControl>
            <ButtonControl type="submit" disabled={this.communityBusy}>
              {labels.save}
            </ButtonControl>
          </DialogActionFooter>
        </DialogForm>
      </dialog>,
      this.communityEditorHost,
    );
  }
  override destroy(): void {
    if (this.communityOwnsEditor) {
      this.close();
      this.communityEditorHost.remove();
    }
    super.destroy();
  }
}
