import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
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

  private savedMode: 'light' | 'dark' = this.themeStore.darkMode() ? 'dark' : 'light';
  private savedThemeName: AppThemeName = this.themeStore.themeName();
  private savedLedgerCacheEnabled = this.ledgerCachePrefs.enabled();

  protected readonly appearanceModel = signal<AppearanceFormModel>({
    mode: this.savedMode,
    themeName: this.savedThemeName,
  });
  protected readonly ledgerCacheEnabled = signal(this.savedLedgerCacheEnabled);

  protected readonly draftMode = computed(() => this.appearanceModel().mode);
  protected readonly draftThemeName = computed(() => this.appearanceModel().themeName);
  protected readonly draftLedgerCacheEnabled = computed(() => this.ledgerCacheEnabled());

  protected readonly isSavingAppearance = signal(false);
  protected readonly appearanceSaveSuccess = signal(false);
  protected readonly appearanceSaveError = signal<string | null>(null);
  protected readonly isSavingLedgerCache = signal(false);
  protected readonly ledgerCacheSaveSuccess = signal(false);
  protected readonly ledgerCacheSaveError = signal<string | null>(null);

  protected readonly themeOptions: ThemeOption[] = THEME_OPTIONS;
  protected readonly getThemeLabel = (opt: ThemeOption) => opt.label;
  protected readonly getThemeValue = (opt: ThemeOption) => opt.value;
  protected readonly trackThemeBy = (_i: number, opt: ThemeOption) => opt.value;

  protected onModeChange(value: unknown): void {
    const mode = value === 'dark' ? 'dark' : 'light';
    this.appearanceModel.update((m) => ({ ...m, mode }));
    this.themeStore.setDarkMode(mode === 'dark');
    this.appearanceSaveError.set(null);
  }

  protected onThemeChange(value: unknown): void {
    const themeName = this.resolveThemeName(value);
    if (themeName === null) {
      this.appearanceSaveError.set('Select a valid theme.');
      return;
    }

    this.appearanceModel.update((m) => ({ ...m, themeName }));
    this.themeStore.setThemeName(themeName);
    this.appearanceSaveError.set(null);
  }

  protected async onLedgerCacheChange(value: unknown): Promise<void> {
    const enabled = !!value;
    if (enabled === this.ledgerCacheEnabled() || this.isSavingLedgerCache()) return;

    const previousValue = this.ledgerCacheEnabled();
    this.ledgerCacheEnabled.set(enabled);
    this.ledgerCachePrefs.setEnabled(enabled);
    this.isSavingLedgerCache.set(true);
    this.ledgerCacheSaveSuccess.set(false);
    this.ledgerCacheSaveError.set(null);

    try {
      await this.userProfileService.updateProfile({ ledgerCache: enabled });
      this.ledgerCachePrefs.commit();
      this.savedLedgerCacheEnabled = enabled;
      this.ledgerCacheSaveSuccess.set(true);
      setTimeout(() => this.ledgerCacheSaveSuccess.set(false), 2500);
    } catch (err) {
      this.ledgerCacheEnabled.set(previousValue);
      this.ledgerCachePrefs.setEnabled(previousValue);
      this.ledgerCacheSaveError.set(
        err instanceof Error ? err.message : 'Failed to save cache settings.',
      );
    } finally {
      this.isSavingLedgerCache.set(false);
    }
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
    if (this.isSavingAppearance()) return;

    const { mode, themeName } = this.appearanceModel();

    this.isSavingAppearance.set(true);
    this.appearanceSaveSuccess.set(false);
    this.appearanceSaveError.set(null);

    try {
      await this.userProfileService.updateProfile({
        mode,
        theme: themeName,
      });

      this.themeStore.commitTheme();
      this.savedMode = mode;
      this.savedThemeName = themeName;

      this.appearanceSaveSuccess.set(true);
      setTimeout(() => this.appearanceSaveSuccess.set(false), 2500);
    } catch (err) {
      this.appearanceSaveError.set(err instanceof Error ? err.message : 'Failed to save appearance.');
    } finally {
      this.isSavingAppearance.set(false);
    }
  }

  ngOnDestroy(): void {
    this.themeStore.setDarkMode(this.savedMode === 'dark');
    this.themeStore.setThemeName(this.savedThemeName);
    this.ledgerCachePrefs.setEnabled(this.savedLedgerCacheEnabled);
  }
}
