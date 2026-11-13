import { popupOwnsTarget } from '@revolist/ui/core/top-layer-popup';
import { announcePopupOpen, subscribeToPopupOpen } from '@revolist/grid-runtime';
import { calculateAnchoredPopoverPosition } from '@revolist/ui/core/anchored-popover';
import { hideTopLayerPopup, showTopLayerPopup, type TopLayerPopupMode } from '@revolist/ui/core/top-layer-popup';

let nextId = 0;
/** Lifecycle for the toolbar's transient, non-modal filter surface. */
export class KanbanToolbarPopover {
  readonly id = `kanban-toolbar-filters-${++nextId}`;
  private button?: HTMLButtonElement;
  private panel?: HTMLElement;
  private mode?: TopLayerPopupMode;
  private frame?: number;
  private releasePopup?: () => void;
  private disposed = false;
  open = false;

  constructor(
    private readonly grid: HTMLRevoGridElement,
    private readonly onChange: () => void,
  ) {}
  readonly buttonRef = (element: HTMLButtonElement | null) => {
    this.button = element ?? undefined;
  };
  readonly panelRef = (element: HTMLElement | null) => {
    if (element !== this.panel) {
      this.close(false);
    }
    this.panel = element ?? undefined;
  };
  refresh(): void {
    this.position();
  }
  toggle(): void {
    if (this.open) {
      this.close();
    } else {
      this.show();
    }
  }
  close(restoreFocus = true): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    const view = this.grid.ownerDocument.defaultView;
    if (this.frame !== undefined) {
      view?.cancelAnimationFrame(this.frame);
    }
    this.frame = undefined;
    view?.removeEventListener('resize', this.position);
    view?.removeEventListener('scroll', this.position, true);
    this.grid.ownerDocument.removeEventListener('pointerdown', this.outside, true);
    this.grid.ownerDocument.removeEventListener('keydown', this.keydown, true);
    this.releasePopup?.();
    this.releasePopup = undefined;
    if (this.panel) {
      hideTopLayerPopup(this.panel, this.mode);
      this.panel.removeAttribute('data-open');
    }
    this.mode = undefined;
    if (restoreFocus && this.button?.isConnected) {
      this.button.focus({ preventScroll: true });
    }
    if (!this.disposed) {
      this.onChange();
    }
  }
  destroy(): void {
    this.disposed = true;
    this.close(false);
    this.panel = undefined;
    this.button = undefined;
  }
  private show(): void {
    if (this.disposed || !this.panel?.isConnected || !this.button?.isConnected) {
      return;
    }
    this.open = true;
    announcePopupOpen(this.grid, this);
    this.releasePopup = subscribeToPopupOpen(this.grid, this, () => this.close(false));
    this.mode = showTopLayerPopup(this.panel);
    this.panel.setAttribute('data-open', '');
    this.position();
    const view = this.grid.ownerDocument.defaultView;
    view?.addEventListener('resize', this.position);
    view?.addEventListener('scroll', this.position, true);
    this.grid.ownerDocument.addEventListener('pointerdown', this.outside, true);
    this.grid.ownerDocument.addEventListener('keydown', this.keydown, true);
    this.onChange();
    this.frame = view?.requestAnimationFrame(() => {
      this.frame = undefined;
      if (this.open) {
        this.panel?.querySelector<HTMLElement>('[role=combobox]')?.focus({ preventScroll: true });
      }
    });
  }
  private readonly position = (): void => {
    const view = this.grid.ownerDocument.defaultView;
    if (!this.open || !view || !this.panel || !this.button) {
      return;
    }
    this.panel.style.width = `${Math.max(0, Math.min(280, view.innerWidth - 16))}px`;
    this.panel.style.maxHeight = `${Math.max(0, view.innerHeight - 16)}px`;
    const position = calculateAnchoredPopoverPosition(
      this.button.getBoundingClientRect(),
      this.panel.getBoundingClientRect(),
      { width: view.innerWidth, height: view.innerHeight },
      8,
    );
    this.panel.style.left = `${position.left}px`;
    this.panel.style.top = `${position.top}px`;
  };
  private readonly outside = (event: Event): void => {
    const target = event.target as Node;
    if (!(this.panel && popupOwnsTarget(this.panel, target)) && !this.button?.contains(target)) {
      this.close(false);
    }
  };
  private readonly keydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      if (this.panel?.querySelector('[aria-expanded="true"]')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.close();
    }
  };
}
