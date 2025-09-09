import { Component, OnInit } from '@angular/core';
import { WithFormDraftBinding } from '../../../../../../util/form/with-form-draft-binding';

@Component({
  selector: 'app-create-ledger',
  imports: [],
  templateUrl: './create-ledger.html',
  styleUrl: './create-ledger.css'
})
export class CreateLedger extends WithFormDraftBinding implements OnInit {
  
  ngOnInit(): void {
    
  }

  
}
