import { Injectable } from '@angular/core';
import { ConfigModel } from './store/config.model';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config!: ConfigModel;

  setConfig(config: ConfigModel) {
    this.config = config;
  }

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  // Optional fallback if needed
  getConfig(): ConfigModel {
    return this.config;
  }
}
