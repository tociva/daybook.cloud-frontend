import { Component, inject } from '@angular/core';
import { ToastStore } from '../store/toast/toast.store';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-toaster',
  imports: [NgClass],
  templateUrl: './toaster.html',
  styleUrl: './toaster.css'
})
export class Toaster {

  readonly toastStore = inject(ToastStore);
}
