// src/app/features/events/modals/create-event-modal.ts
import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';

import { EventService } from '@core/services/event.service';
import { CategoryService, Category } from '@core/services/category';
import { AuthService } from '@core/services/auth.service';
import { CreateEventDto } from '@core/models/event.model';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-create-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardIconComponent,
  ],
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(3px);
    }
    .modal-box {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 16px;
      border: 1px solid hsl(var(--border));
      /* Explicitly use background token — guaranteed visible in light mode */
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 22px;
      border-bottom: 1px solid hsl(var(--border));
    }
    .modal-body {
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .modal-foot {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 22px;
      border-top: 1px solid hsl(var(--border));
    }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: hsl(var(--foreground));
    }
    .req { color: hsl(var(--destructive)); }
    .field-error { font-size: 11px; color: hsl(var(--destructive)); margin-top: 2px; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 480px) { .row2 { grid-template-columns: 1fr; } }
    .close-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 7px;
      border: none; background: transparent;
      color: hsl(var(--muted-foreground));
      cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
  `],
  template: `
    <!-- Backdrop -->
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-head">
          <div style="display:flex;align-items:center;gap:11px">
            <div style="
              width:38px;height:38px;border-radius:50%;
              background:hsl(var(--primary)/0.12);
              display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <z-icon zType="plus" style="width:18px;height:18px;color:hsl(var(--primary))" />
            </div>
            <div>
              <p style="font-size:17px;font-weight:700;margin:0;color:hsl(var(--foreground))">Create New Event</p>
              @if (organizationName()) {
                <p style="font-size:12px;margin:0;color:hsl(var(--muted-foreground))">{{ organizationName() }}</p>
              }
            </div>
          </div>
          <button class="close-btn" (click)="onClose()">
            <z-icon zType="x" style="width:16px;height:16px" />
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
          <div class="modal-body">

            <!-- Title -->
            <div class="field">
              <label class="field-label">Event Title <span class="req">*</span></label>
              <input z-input type="text" formControlName="title" placeholder="Enter event title..." style="width:100%" />
              @if (f['title'].invalid && f['title'].touched) {
                <span class="field-error">Title is required (min 3 characters)</span>
              }
            </div>

            <!-- Description -->
            <div class="field">
              <label class="field-label">Description <span class="req">*</span></label>
              <textarea z-input formControlName="description" placeholder="Describe your event..." rows="3"
                style="width:100%;resize:none"></textarea>
            </div>

            <!-- Start / End -->
            <div class="row2">
              <div class="field">
                <label class="field-label">Start Time <span class="req">*</span></label>
                <input z-input type="datetime-local" formControlName="start_time" style="width:100%" />
              </div>
              <div class="field">
                <label class="field-label">End Time <span class="req">*</span></label>
                <input z-input type="datetime-local" formControlName="end_time" style="width:100%" />
              </div>
            </div>

            <!-- Type / Category -->
            <div class="row2">
              <div class="field">
                <label class="field-label">Event Type <span class="req">*</span></label>
                <select z-input formControlName="event_type" style="width:100%">
                  <option [value]="0">In-Person</option>
                  <option [value]="1">Online</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">Category <span class="req">*</span></label>
                <select z-input formControlName="categoryId" style="width:100%">
                  <option [value]="null" disabled>Select category...</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Location or Online URL -->
            @if (!isOnline()) {
              <div class="row2">
                <div class="field">
                  <label class="field-label">City <span class="req">*</span></label>
                  <input z-input type="text" formControlName="city" placeholder="City" style="width:100%" />
                </div>
                <div class="field">
                  <label class="field-label">Region <span class="req">*</span></label>
                  <input z-input type="text" formControlName="region" placeholder="Region / State" style="width:100%" />
                </div>
              </div>
            } @else {
              <div class="field">
                <label class="field-label">Online URL <span class="req">*</span></label>
                <input z-input type="url" formControlName="online_url"
                  placeholder="https://meet.example.com/..." style="width:100%" />
              </div>
            }

            <!-- Image URL -->
            <div class="field">
              <label class="field-label">Event Image URL</label>
              <input z-input type="url" formControlName="event_img_url"
                placeholder="https://..." style="width:100%" />
            </div>

          </div>

          <!-- Footer -->
          <div class="modal-foot">
            <button z-button zType="outline" type="button" (click)="onClose()" [disabled]="loading()">
              Cancel
            </button>
            <button z-button zType="default" type="submit" [disabled]="loading()">
              @if (loading()) {
                <z-icon zType="loader" class="w-4 h-4 mr-2 animate-spin" />
                Creating...
              } @else {
                <z-icon zType="save" class="w-4 h-4 mr-2" />
                Create Event
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  `,
})
export class CreateEventModalComponent implements OnInit {
  created = output<void>();
  close = output<void>();

  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  eventForm!: FormGroup;
  categories = signal<Category[]>([]);
  loading = signal(false);
  organizationName = signal('');
  organizationId = signal<number | null>(null);

  isOnline = computed(() => Number(this.eventForm?.get('event_type')?.value) === 1);

  get f() { return this.eventForm.controls; }

  ngOnInit() {
    this.loadOrganizationInfo();
    this.loadCategories();
    this.initForm();
  }

  private loadOrganizationInfo() {
    const org = this.authService.getOrganization();
    if (org) { this.organizationName.set(org.name); this.organizationId.set(org.id); }
    else { toast.error('Organization not found. Please log in again.'); this.onClose(); }
  }

  private loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (d) => this.categories.set(d),
      error: () => toast.error('Failed to load categories'),
    });
  }

  private initForm() {
    this.eventForm = this.fb.group({
      title:          ['', [Validators.required, Validators.minLength(3)]],
      description:    ['', Validators.required],
      event_img_url:  [''],
      start_time:     ['', Validators.required],
      end_time:       ['', Validators.required],
      event_type:     [0,  Validators.required],
      city:           ['', Validators.required],
      region:         ['', Validators.required],
      online_url:     [''],
      categoryId:     [null, Validators.required],
      organizationId: [this.organizationId()],
    });
    this.eventForm.get('event_type')?.valueChanges.subscribe((t) => this.updateValidators(Number(t)));
  }

  private updateValidators(type: number) {
    const c = this.eventForm.get('city')!;
    const r = this.eventForm.get('region')!;
    const u = this.eventForm.get('online_url')!;
    if (type === 1) {
      c.clearValidators(); r.clearValidators();
      u.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      c.setValidators(Validators.required); r.setValidators(Validators.required);
      u.clearValidators();
    }
    [c, r, u].forEach((ctrl) => ctrl.updateValueAndValidity());
  }

  onSubmit() {
    if (this.eventForm.invalid) { this.eventForm.markAllAsTouched(); toast.error('Please fill in all required fields'); return; }
    this.loading.set(true);
    const v = this.eventForm.value;
    const dto: CreateEventDto = {
      title: v.title, description: v.description,
      event_img_url: v.event_img_url || null,
      start_time: new Date(v.start_time).toISOString(),
      end_time:   new Date(v.end_time).toISOString(),
      event_type: Number(v.event_type),
      city: v.city || null, region: v.region || null, online_url: v.online_url || null,
      categoryId: v.categoryId, organizationId: v.organizationId,
    };
    this.eventService.createEvent(dto).subscribe({
      next: () => { toast.success('Event created!'); this.loading.set(false); this.created.emit(); },
      error: () => this.loading.set(false),
    });
  }

  onClose() { this.close.emit(); }
}