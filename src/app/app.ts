import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingComponent } from "@features/landing/landing";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LandingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('app');

}
