import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogModule, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import isEqual from 'lodash/isEqual';
import { SharedService } from '../../../services/shared.service';
import { AuthService } from '../../../services/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-jobappliction-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatTooltipModule, CommonModule, MatDialogTitle, MatDialogContent, MatButtonModule, MatDialogModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './jobappliction-form.component.html',
  styleUrl: './jobappliction-form.component.css'
})
export class JobapplictionFormComponent implements OnInit {

  private sharedServ = inject(SharedService)
  private auth = inject(AuthService)
  fb = inject(FormBuilder)
  data = inject(MAT_DIALOG_DATA);
  dialog = inject(MatDialog);
  private editDialogRef = inject(MatDialogRef<JobapplictionFormComponent>)

  applicationForm = this.fb.group({
    date: [{ value: new Date(this.data.applicationDate).toISOString().split('T')[0], disabled: true }],
    subject: [this.data.subject],
    from: [{ value: this.data.from, disabled: true }],
    status: [this.data.status],
    companyName: [this.data.companyName],
    jobTitle: [this.data.jobTitle],
    source: [{ value: this.data.source, disabled: true }],
    notes: [this.data.notes],
  })
  initialForm = this.applicationForm.value

  ngOnInit(): void {
    // console.log(this.data.messageId);

  }

  submitForm() {
    if (!isEqual(this.applicationForm.value, this.initialForm)) {
      const user = this.auth.user()!;
      this.sharedServ.updateApplication(user, this.data.messageId, this.applicationForm.value)
    }
  }

  confirmArchive(messageId: any) {
    const user = this.auth.user()!;
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { actions: 'archive' },
      width: "30rem",
    })
    confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sharedServ.archiveApplication(user, messageId, this.data)?.subscribe({
          next: data => {
            this.editDialogRef.close('archived')
          }, error: (err) => {
            console.error('One or both operations failed:', err);
          }
        })
      }
    })
  }

  confirmDelete(messageId: any) {
    const user = this.auth.user()!;
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { actions: 'delete' },
      width: "30rem",
    })
    confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.sharedServ.deleteApplication(user, messageId, this.data)?.subscribe({
          next: data => {
            this.editDialogRef.close('deleted')
          }, error: (err) => {
            console.error('One or both operations failed:', err);
          }
        })
      }
    })
  }
}
