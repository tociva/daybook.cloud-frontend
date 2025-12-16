import { Component } from '@angular/core';
import { LogoBlockComponent } from '../../shared/logo-block/logo-block.component';
@Component({
  selector: 'app-dashboard',
  imports: [LogoBlockComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  printSection() {
    const printContent = document.getElementById('print-area')?.innerHTML;
  
    if (printContent) {
      const original = document.body.innerHTML;
  
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = original;
    }
  }
  
}
