/** Native controls own their tokens, including editor surfaces mounted outside the grid. */
export function syncKanbanTheme(grid: HTMLRevoGridElement, host: HTMLElement): void {
  host.dataset.theme = grid.theme?.toLowerCase().includes('dark') ? 'dark' : 'light';
}
