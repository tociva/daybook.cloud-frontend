import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { TaxGroupStore } from '../../../data/tax-group';
import { TaxStore } from '../../../data/tax';
import type { Tax } from '../../../data/tax';

@Component({
  selector: 'app-view-tax-group',
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-tax-group.component.html',
  styleUrl: './view-tax-group.component.css',
})
export class ViewTaxGroupComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly taxStore = inject(TaxStore);

  /** Fast ID→Tax lookup built reactively from the full tax catalog. */
  private readonly taxMap = computed(() => {
    const map = new Map<string, Tax>();
    for (const t of this.taxStore.catalog()) {
      if (t.id) map.set(t.id, t);
    }
    return map;
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.taxGroupStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    const skipGroupFetch = id != null && this.taxGroupStore.selectedItem()?.id === id;
    await Promise.all([
      skipGroupFetch ? Promise.resolve(null) : id ? this.taxGroupStore.loadTaxGroupById(id) : Promise.resolve(null),
      this.taxStore.ensureTaxCatalogLoaded(),
    ]);
  }

  /**
   * Returns the Tax for a given ID, or undefined if not yet loaded.
   * Reads from the reactive taxMap so the template re-evaluates automatically
   * when the tax catalog updates.
   */
  protected getTaxById(id: string): Tax | undefined {
    return this.taxMap().get(id);
  }

  /**
   * Returns the deduplicated tax IDs for a group, normalising both the
   * `taxids` field (write-side) and the `taxes` field (read-side) that the
   * API may populate.
   */
  protected getGroupTaxIds(group: {
    taxids?: readonly string[];
    taxes?: readonly string[];
  }): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of [...(group.taxids ?? []), ...(group.taxes ?? [])]) {
      if (id && !seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }
    return result;
  }

  protected edit(): void {
    const id = this.taxGroupStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/tax-group', id, 'edit'], {
        queryParams: { burl: this.burlNavigation.getBackUrl() },
      });
    }
  }
}
