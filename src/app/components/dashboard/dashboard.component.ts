import { AfterViewInit, Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';
import { toSignal } from '@angular/core/rxjs-interop'
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule, DatePipe } from '@angular/common';
import { User } from '@angular/fire/auth';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { JobapplictionFormComponent } from "../jobappliction-form/jobappliction-form.component";
import { FormGroup } from '@angular/forms';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, MatTableModule, MatPaginatorModule, MatSortModule, DatePipe, MatButtonModule, MatDialogModule],
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
  dataSource = new MatTableDataSource<any[]>([]);

  isLoading = false;
  applications: any[] = []



  constructor() {
    effect(() => {
      // console.log(`everytime user changes i am here`);
      const user = this.auth.user();
      if (user) {
        this.isLoading = true
        this.loadApplications(user);
      }
    });

    effect(() => {
      // console.log(`everytime app data changes we are here`);
      this.applications = this.sharedServ.appSignal()
      if (this.applications.length > 0) {
        this.isLoading = false
      }
    });

    effect(() => {
      this.isLoading = this.sharedServ.isLoadingSignal()
      console.log(this.isLoading);
    })
  }

  loadApplications(user: User) {
    this.sharedServ.getApplications(user).subscribe(apps => {
      this.applications = (apps);
      this.isLoading = false
      this.dataSource.data = this.applications
      setTimeout(() => {
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        } else {
          console.warn('🚨 Paginator is still undefined');
        }
      });
    })
  }

  announceSortChange(sortState: Sort) {
    console.log(sortState);

    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  editJobApplication(element: any) {
    console.log(element);
    const dialogRef = this.dialog.open(JobapplictionFormComponent, {
      data: element
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

}
