export function shouldShowCrudEmptyState(pageItemCount: number, totalItems: number): boolean {
  return pageItemCount === 0 && totalItems === 0;
}
