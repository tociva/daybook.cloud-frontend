
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-loading-screen',
  imports: [],
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.css'
})
export class LoadingScreenComponent {

  message = model<string | null>(null);


}
