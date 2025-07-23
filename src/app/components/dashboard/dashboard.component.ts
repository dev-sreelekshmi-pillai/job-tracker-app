import { Component, effect, inject, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { User } from '@angular/fire/auth';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { JobapplictionFormComponent } from "../reusable/jobappliction-form/jobappliction-form.component";
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../reusable/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatSlideToggleModule, MatTableModule, MatPaginatorModule, MatSortModule, DatePipe, MatButtonModule, MatDialogModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  @ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(JobapplictionFormComponent) appFormView!: JobapplictionFormComponent;


  public auth = inject(AuthService)
  public sharedServ = inject(SharedService)
  private _liveAnnouncer = inject(LiveAnnouncer);
  dialog = inject(MatDialog);
  displayedColumns: string[] = ['date', 'subject', 'from', 'status', 'companyName', 'jobTitle', 'source', 'notes', 'edit'];
  applications = new MatTableDataSource<any[]>([]);

  isLoading = false;
  // applications: any[] = []
  mailLink = `https://mail.google.com/mail/u/0/#all/
`


  constructor() {
    effect(() => {
      // console.log(`everytime user changes i am here`);
      const user = this.auth.user();
      if (user) {
        this.isLoading = true
        this.loadApplications(user);
      }
    });
    // effect(() => {
    //   // console.log(`everytime app data changes we are here`);
    //   this.applications = this.sharedServ.appSignal()
    //   if (this.applications.length > 0) {
    //     this.isLoading = false
    //   }
    // });
    effect(() => {
      this.isLoading = this.sharedServ.isLoadingSignal()
      // console.log(this.isLoading);
    })
  }

  loadApplications(user: User) {
    this.sharedServ.getApplications(user).subscribe(apps => {
      this.isLoading = false
      this.applications.data = apps
      setTimeout(() => {
        if (this.paginator) {
          this.applications.paginator = this.paginator;
          this.applications.sort = this.sort;
        } else {
          console.warn('🚨 Paginator is still undefined');
        }
      });
    })
  }

  announceSortChange(sortState: Sort) {
    //   console.log(sortState);
    //   if (sortState.direction) {
    //     this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    //   } else {
    //     this._liveAnnouncer.announce('Sorting cleared');
    //   }
  }

  editJobApplication(element: any) {
    const dialogRef = this.dialog.open(JobapplictionFormComponent, {
      data: element,
      width: "50rem",
      height: "80%"
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'archived' || result === 'deleted') {
        this.applications.data = this.applications.data.flat().filter(app =>
          app.messageId !== element.messageId)
      }
      else if (result) {
        this.applications.data = this.applications.data.flat().map(app =>
          app.messageId == element.messageId ? { ...app, ...result } : app
        )
      }
    });
  }


  // confirmArchive(appArchiveData: any) {
  //   const user = this.auth.user()!;
  //   const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
  //     data: { actions: 'archive' },
  //     width: "30rem",
  //   })
  //   confirmDialogRef.afterClosed().subscribe(result => {
  //     if (result) {
  //       this.applications.data = this.applications.data.flat().filter(app =>
  //         app.messageId !== appArchiveData.messageId)
  //       this.sharedServ.archiveApplication(user, appArchiveData.messageId, appArchiveData)?.subscribe({
  //         next: data => {
  //           console.log(data);
  //           console.log('Archived & deleted (parallel)')
  //         }, error: (err) => {
  //           console.log(console.error('One or both operations failed:', err));
  //         }
  //       })
  //     }
  //   })
  // }

}
