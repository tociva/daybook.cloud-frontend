import { Injectable } from '@angular/core';
import { AppConfig, AuthConfig } from './app-config.model';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Config field "${fieldName}" must be a string.`);
  }
  return value;
}

function asOptionalString(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return asString(value, fieldName);
}

function parseAuthConfig(value: unknown, key: string): AuthConfig {
  if (!isRecord(value)) {
    throw new Error(`Config section "${key}" is invalid.`);
  }

  return {
    authority: asString(value['authority'], `${key}.authority`),
    clientId: asString(value['clientId'], `${key}.clientId`),
    redirectUri: asString(value['redirectUri'], `${key}.redirectUri`),
    postLoginRedirect: asOptionalString(value['postLoginRedirect'], `${key}.postLoginRedirect`),
    scope: asString(value['scope'], `${key}.scope`),
    postLogoutRedirect: asString(value['postLogoutRedirect'], `${key}.postLogoutRedirect`),
  };
}

function parseAppConfig(value: unknown): AppConfig {
  if (!isRecord(value)) {
    throw new Error('Config payload is invalid.');
  }

  return {
    auth: parseAuthConfig(value['auth'], 'auth'),
    apiBaseUrl: asString(value['apiBaseUrl'], 'apiBaseUrl'),
  };
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  async loadConfig(): Promise<AppConfig> {
    const response = await fetch('/config/config.json', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load app config: ${response.status}`);
    }

    const payload: unknown = await response.json();
    return parseAppConfig(payload);
  }
}
