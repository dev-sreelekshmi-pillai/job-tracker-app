import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatDialogContent, MatButtonModule, MatDialogActions, TitleCasePipe],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}
