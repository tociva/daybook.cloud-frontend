import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-cancel-button',
  standalone: true,
  templateUrl: './cancel-button.html',
  styleUrl: './cancel-button.css'
})
export class CancelButton {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  backUrl = toSignal(
    this.route.queryParams.pipe(
      map(params => params['burl'] ?? null)
    ),
    { initialValue: null }
  );

  onCancel(): void {
    const url = this.backUrl();
    if (url) {
      this.router.navigateByUrl(url);
    }
  }
}
