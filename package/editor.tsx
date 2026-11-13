import type { DataType, PluginProviders, ColumnProp } from '@revolist/revogrid';
import { KanbanPlugin } from './plugin.js';
import { resolveKanbanLabels } from './labels.js';
import { KanbanEditorController, type EditorContribution, type EditorBoard } from './internal/editor/controller.js';
import type { KanbanCardEditorDialogOptions as EditorOptions } from './internal/editor/types.js';
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
export class KanbanCardEditorDialogPlugin<T extends DataType = DataType> extends KanbanEditorController<T> {
  constructor(
    grid: HTMLRevoGridElement,
    providers: PluginProviders,
    board?: KanbanPlugin<T>,
    contribution?: EditorContribution<T>,
  ) {
    const current = () => board ?? (providers.plugins.getByClass(KanbanPlugin) as KanbanPlugin<T> | undefined);
    const publicBoard = (): EditorBoard<T> | undefined => {
      const plugin = current();
      if (!plugin) {
        return undefined;
      }
      return {
        getConfig: () => {
          const config = plugin.getConfig();
          if (!config) {
            return null;
          }
          return {
            ...config,
            idField: config.fields?.id ?? config.idField ?? 'id',
            columnField: config.fields?.status ?? config.columnField ?? 'status',
            orderField: config.orderField ?? 'order',
            card: { ...config.card, titleField: config.fields?.title ?? config.card?.titleField ?? 'title' },
          };
        },
        getProjection: () => plugin.getProjection(),
        getCards: () => plugin.getCards(),
        createCard: (card, options) => plugin.createCard(card, options),
        updateCard: (id, patch, options) => plugin.updateCard(id, patch, options),
        deleteCards: (ids, options) => plugin.deleteCards(ids, options),
      };
    };
    super(
      grid,
      providers,
      contribution ?? {
        board: publicBoard,
        options: (value) => {
          const options = value as unknown as KanbanCardEditorDialogOptions<T>;
          return {
            confirmDelete: false,
            confirmDiscard: false,
            fields: options.fields?.map((field) => ({ ...field, id: String(field.prop), field: field.prop })),
            validate: options.validate ? ({ draft }) => options.validate!(draft) : undefined,
          };
        },
        fields: (config, options) => {
          const labels = resolveKanbanLabels(config.labels);
          return [
            ...(options.fields ?? [
              { id: 'title', field: config.card.titleField, label: labels.title, required: true, fullWidth: true },
              {
                id: 'description',
                field: config.card.descriptionField ?? 'description',
                label: labels.description,
                kind: 'textarea' as const,
              },
            ]),
            {
              id: 'status',
              field: config.columnField,
              label: labels.column,
              kind: 'select' as const,
              options: config.columns?.map((column: any) => ({
                value: column.prop,
                label: column.name ?? String(column.prop),
              })),
            },
          ];
        },
        labels: () => {
          const labels = resolveKanbanLabels(current()?.getConfig()?.labels);
          return {
            newCard: labels.newCard,
            validationSummary: labels.validationSummary,
            required: labels.required,
            untitledCard: labels.title,
            cancel: labels.cancel,
            save: labels.save,
            delete: labels.delete,
          };
        },
      },
    );
  }
}
