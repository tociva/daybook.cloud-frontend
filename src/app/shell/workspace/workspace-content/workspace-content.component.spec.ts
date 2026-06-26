import { Component, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Routes, Router } from '@angular/router';
import { WorkspaceContentComponent } from './workspace-content.component';

@Component({
  selector: 'app-workspace-content-current-page',
  standalone: true,
  template: 'Current page',
})
class CurrentPageComponent {}

@Component({
  selector: 'app-workspace-content-lazy-page',
  standalone: true,
  template: 'Lazy page',
})
class LazyPageComponent {}

@Component({
  selector: 'app-workspace-content-next-page',
  standalone: true,
  template: 'Next page',
})
class NextPageComponent {}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

async function setup(routes: Routes = [{ path: 'current', component: CurrentPageComponent }]) {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [WorkspaceContentComponent],
    providers: [provideRouter(routes)],
  }).compileComponents();

  const fixture = TestBed.createComponent(WorkspaceContentComponent);
  const router = TestBed.inject(Router);
  fixture.detectChanges();

  return { fixture, router };
}

function querySkeleton(fixture: ComponentFixture<WorkspaceContentComponent>) {
  return (fixture.nativeElement as HTMLElement).querySelector('.workspace-route-skeleton');
}

describe('WorkspaceContentComponent', () => {
  it('shows the skeleton while a path-changing lazy route navigation is pending', async () => {
    const lazyRoute = createDeferred<Type<LazyPageComponent>>();
    const { fixture, router } = await setup([
      { path: 'current', component: CurrentPageComponent },
      { path: 'lazy', loadComponent: () => lazyRoute.promise },
    ]);

    await router.navigateByUrl('/current');
    await fixture.whenStable();
    fixture.detectChanges();

    const navigation = router.navigateByUrl('/lazy');
    fixture.detectChanges();

    expect(querySkeleton(fixture)).not.toBeNull();

    lazyRoute.resolve(LazyPageComponent);
    await navigation;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(querySkeleton(fixture)).toBeNull();
  });

  it('does not show the skeleton for query-only navigation on the same path', async () => {
    const { fixture, router } = await setup([
      { path: 'current', component: CurrentPageComponent },
    ]);

    await router.navigateByUrl('/current');
    await fixture.whenStable();
    fixture.detectChanges();

    const navigation = router.navigateByUrl('/current?page=2');
    fixture.detectChanges();

    expect(querySkeleton(fixture)).toBeNull();

    await navigation;
    await fixture.whenStable();
    fixture.detectChanges();

    expect(querySkeleton(fixture)).toBeNull();
  });

  it('clears the skeleton after a canceled path-changing navigation', async () => {
    const { fixture, router } = await setup([
      { path: 'current', component: CurrentPageComponent },
      { path: 'blocked', component: NextPageComponent, canActivate: [() => false] },
    ]);

    await router.navigateByUrl('/current');
    await fixture.whenStable();
    fixture.detectChanges();

    await router.navigateByUrl('/blocked');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(querySkeleton(fixture)).toBeNull();
  });

  it('clears the skeleton after a failed path-changing navigation', async () => {
    const { fixture, router } = await setup([
      { path: 'current', component: CurrentPageComponent },
      {
        path: 'broken',
        loadComponent: () => Promise.reject(new Error('Failed to load route.')),
      },
    ]);

    await router.navigateByUrl('/current');
    await fixture.whenStable();
    fixture.detectChanges();

    await router.navigateByUrl('/broken').catch(() => false);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(querySkeleton(fixture)).toBeNull();
  });
});
