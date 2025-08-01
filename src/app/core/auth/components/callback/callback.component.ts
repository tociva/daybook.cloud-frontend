import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/auth/auth.actions';
import { selectConfigLoaded } from '../../../config/store/config.selectors';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent {
  
  readonly configLoaded = this.store.selectSignal(selectConfigLoaded);
  
  readonly triggerAuthInit = effect(() => {
    if (this.configLoaded()) {
      // Delay dispatch to let sessionStorage initialize
      queueMicrotask(() => {
        this.store.dispatch(AuthActions.handleCallback());
      });
    }
  });
  error: string | null = null;
  errorDescription: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private store: Store) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.error = params.get('error');
      this.errorDescription = params.get('error_description');
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  
}
