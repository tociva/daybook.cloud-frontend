import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AppSystemStore } from './core/system/app-system.store';
import { ToastStore } from './core/toast/toast.store';

function createAppSystemStoreMock() {
  return {
    startupStatus: signal('idle'),
    error: signal<string | null>(null),
    initialize: () => undefined,
  };
}

function createToastStoreMock() {
  return {
    events: signal([]),
  };
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AppSystemStore, useValue: createAppSystemStoreMock() },
        { provide: ToastStore, useValue: createToastStoreMock() },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the wordmark', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Daybook.Cloud');
  });
});
