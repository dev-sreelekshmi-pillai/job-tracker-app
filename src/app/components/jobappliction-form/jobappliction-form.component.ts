import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogModule, MatDialogTitle } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-jobappliction-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatDialogTitle, MatDialogContent, MatButtonModule, MatDialogModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './jobappliction-form.component.html',
  styleUrl: './jobappliction-form.component.css'
})
export class JobapplictionFormComponent implements OnInit {

  ngOnInit(): void {
    console.log(this.data);

  }
  fb = inject(FormBuilder)
  data = inject(MAT_DIALOG_DATA);

  applicationForm = this.fb.group({
    date: [this.data.date],
    subject: [this.data.subject],
    from: [this.data.from],
    status: [this.data.status],
    companyName: [this.data.companyName],
    jobTitle: [this.data.jobTitle],
    source: [this.data.source],
    notes: [this.data.notes],
  })


}
