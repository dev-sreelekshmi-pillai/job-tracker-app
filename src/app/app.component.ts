import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavbarComponent } from "./components/navbar/navbar.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { ReactiveFormsModule, } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NavbarComponent, DashboardComponent, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
}
