import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
  TngAvatarComponent,
  TngButtonComponent,
  TngButtonToggleComponent,
  TngButtonToggleGroupComponent,
  TngFormFieldComponent,
  TngLabelComponent,
  TngSelectComponent,
  TngSwitchComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { LedgerCachePreferencesStore } from '../../../../../core/preferences/ledger-cache-preferences.store';
import type { AppThemeName, ThemeOption } from '../../../../../core/theme/app-theme.store';
import { AppThemeStore, THEME_OPTIONS } from '../../../../../core/theme/app-theme.store';
import { UserSessionStore } from '../../../management/data/user-session/user-session.store';
import { UserProfileService } from '../../data/user-profile.service';

type AppearanceFormModel = {
  ledgerCacheEnabled: boolean;
  mode: 'light' | 'dark';
  themeName: AppThemeName;
};

@Component({
  selector: 'app-profile',
  imports: [
    TngAvatarComponent,
    TngButtonComponent,
    TngButtonToggleGroupComponent,
    TngButtonToggleComponent,
    TngFormFieldComponent,
    TngLabelComponent,
    TngSelectComponent,
    TngSwitchComponent,
    TngIcon,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnDestroy {
  private readonly themeStore = inject(AppThemeStore);
  private readonly ledgerCachePrefs = inject(LedgerCachePreferencesStore);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly userProfileService = inject(UserProfileService);

  protected readonly userDisplayName = computed(() => {
    const session = this.userSessionStore.session();
    return (
      session?.displayname ??
      session?.displayName ??
      session?.name ??
      session?.username ??
      'Daybook User'
    );
  });

  protected readonly userEmail = computed(() => this.userSessionStore.session()?.email ?? '');

  private readonly savedMode: 'light' | 'dark' = this.themeStore.darkMode() ? 'dark' : 'light';
  private readonly savedThemeName: AppThemeName = this.themeStore.themeName();
  private readonly savedLedgerCacheEnabled = this.ledgerCachePrefs.enabled();
  private committed = false;

  protected readonly appearanceModel = signal<AppearanceFormModel>({
    ledgerCacheEnabled: this.savedLedgerCacheEnabled,
    mode: this.savedMode,
    themeName: this.savedThemeName,
  });
  protected readonly appearanceForm = form(this.appearanceModel);

  protected readonly draftMode = computed(() => this.appearanceModel().mode);
  protected readonly draftThemeName = computed(() => this.appearanceModel().themeName);
  protected readonly draftLedgerCacheEnabled = computed(() => this.appearanceModel().ledgerCacheEnabled);

  protected readonly isSaving = signal(false);
  protected readonly saveSuccess = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly themeOptions: ThemeOption[] = THEME_OPTIONS;
  protected readonly getThemeLabel = (opt: ThemeOption) => opt.label;
  protected readonly getThemeValue = (opt: ThemeOption) => opt.value;
  protected readonly trackThemeBy = (_i: number, opt: ThemeOption) => opt.value;

  protected onModeChange(value: unknown): void {
    const mode = value === 'dark' ? 'dark' : 'light';
    this.appearanceModel.update((m) => ({ ...m, mode }));
    this.themeStore.setDarkMode(mode === 'dark');
    this.saveError.set(null);
  }

  protected onThemeChange(value: unknown): void {
    const themeName = this.resolveThemeName(value);
    if (themeName === null) {
      this.saveError.set('Select a valid theme.');
      return;
    }

    this.appearanceModel.update((m) => ({ ...m, themeName }));
    this.themeStore.setThemeName(themeName);
    this.saveError.set(null);
  }

  protected onLedgerCacheChange(value: unknown): void {
    const enabled = !!value;
    this.appearanceModel.update((m) => ({ ...m, ledgerCacheEnabled: enabled }));
    this.ledgerCachePrefs.setEnabled(enabled);
    this.saveError.set(null);
  }

  private resolveThemeName(value: unknown): AppThemeName | null {
    const rawValue =
      typeof value === 'string'
        ? value
        : value !== null && typeof value === 'object' && 'value' in value
          ? (value as { value: unknown }).value
          : null;

    return this.themeOptions.find((option) => option.value === rawValue)?.value ?? null;
  }

  protected async submitAppearance(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSaving()) return;

    const { mode, themeName, ledgerCacheEnabled } = this.appearanceModel();

    this.isSaving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);

    try {
      await this.userProfileService.updateProfile({
        mode,
        theme: themeName,
        ledgerCache: ledgerCacheEnabled,
      });

      this.themeStore.commitTheme();
      this.ledgerCachePrefs.commit();
      this.committed = true;

      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 2500);
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'Failed to save appearance.');
    } finally {
      this.isSaving.set(false);
    }
  }

  ngOnDestroy(): void {
    if (!this.committed) {
      this.themeStore.setDarkMode(this.savedMode === 'dark');
      this.themeStore.setThemeName(this.savedThemeName);
      this.ledgerCachePrefs.setEnabled(this.savedLedgerCacheEnabled);
    }
  }
}
