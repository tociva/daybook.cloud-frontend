import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { App } from './app';
import { ProgressStore } from './core/progress/progress.store';
import { AppSystemStore } from './core/system/app-system.store';
import { ToastStore } from './core/toast/toast.store';

@Component({
  template: '<p data-testid="workspace-route">Workspace route content</p>',
})
class WorkspaceRouteStubComponent {}

function createAppSystemStoreMock() {
  return {
    startupStatus: signal('idle'),
    error: signal<string | null>(null),
    initialize: vi.fn(),
  };
}

function createToastStoreMock() {
  return {
    events: signal([]),
  };
}

describe('App', () => {
  let appSystemStore: ReturnType<typeof createAppSystemStoreMock>;

  beforeEach(async () => {
    appSystemStore = createAppSystemStoreMock();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'app/ghost', component: WorkspaceRouteStubComponent }]),
        { provide: AppSystemStore, useValue: appSystemStore },
        { provide: ProgressStore, useValue: { isVisible: signal(false) } },
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

  it('does not render the active app route below the landing shell while logging out', async () => {
    appSystemStore.startupStatus.set('logging-out');

    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/app/ghost');
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Daybook.Cloud');
    expect(compiled.querySelector('[data-testid="workspace-route"]')).toBeNull();
  });
});
