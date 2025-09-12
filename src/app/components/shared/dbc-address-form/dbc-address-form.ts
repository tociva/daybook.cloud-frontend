import {
  Component,
  DestroyRef,
  Injector,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TextInputDirective } from '../../../util/directives/text-input-directive';

@Component({
  selector: 'dbc-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, TextInputDirective],
  templateUrl: './dbc-address-form.html',
  styleUrl: './dbc-address-form.css',
})
export class DbcAddressForm implements OnInit {
  // Inputs (signal-based)
  group = input.required<FormGroup>();
  labelWidth = input('w-28');
  readonly = input(false);

  // Current address value as a signal (kept in sync with the form)
  readonly address = signal<Record<string, unknown>>({});

  // Small helpers derived from inputs
  readonly labelClass = computed(() => `${this.labelWidth()} shrink-0`);
  readonly disabled = computed(() => this.readonly());

  // ✅ Use Injector, not DestroyRef
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    effect(() => {
      const g = this.group();

      this.address.set(g.getRawValue());
      const sub = g.valueChanges.subscribe(v => this.address.set(v));

      // cleanup
      return () => sub.unsubscribe();
    }, { injector: this.injector });
  }
  
}
