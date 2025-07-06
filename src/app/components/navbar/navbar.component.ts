import { Component, effect, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {

  public auth = inject(AuthService)
  public sharedServ = inject(SharedService)
  user = this.auth.user()
  errMessage = ''
  ngOnInit() { }

  constructor() {
    effect(() => {
      this.user = this.auth.user();
    });
  }

  login() {
    this.auth.loginWithGoogle()

  }

  logout() {
    this.auth.logoutFromGoogle()
  }

  syncUserData() {
    if (this.user) {
      this.sharedServ.isLoadingSignal.set(true)
      this.sharedServ.syncLatestData(this.user).subscribe({
        next: (apps) => {
          this.sharedServ.appSignal.set(apps)
          this.sharedServ.isLoadingSignal.set(false)
        },
        error: (err) => {
          console.error('Sync error:', err)
          this.errMessage = err.error.error.status
          // + '  ' + err.error.error.message
        }
      });
    }
  }
}
