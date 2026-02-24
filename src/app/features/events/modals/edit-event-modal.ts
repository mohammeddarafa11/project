// src/app/features/events/modals/edit-event-modal.ts
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';

import { EventService } from '@core/services/event.service';
import { CategoryService, Category } from '@core/services/category';
import { AuthService } from '@core/services/auth.service';
import { Event as EventModel, EventType, UpdateEventDto } from '@core/models/event.model';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardIconComponent } from '@shared/components/icon/icon.component';

@Component({
  selector: 'app-edit-event-modal',
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
      position: fixed; inset: 0; z-index: 50;
      display: flex; align-items: center; justify-content: center; padding: 16px;
      background: rgba(0,0,0,0.45); backdrop-filter: blur(3px);
    }
    .modal-box {
      width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;
      border-radius: 16px; border: 1px solid hsl(var(--border));
      background: hsl(var(--background)); color: hsl(var(--foreground));
      box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08);
    }
    .modal-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 18px 22px; border-bottom: 1px solid hsl(var(--border));
    }
    .modal-body { padding: 22px; display: flex; flex-direction: column; gap: 16px; }
    .modal-foot {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 22px; border-top: 1px solid hsl(var(--border));
    }
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-label { font-size: 13px; font-weight: 600; color: hsl(var(--foreground)); }
    .req { color: hsl(var(--destructive)); }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 480px) { .row2 { grid-template-columns: 1fr; } }
    .close-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 7px; border: none;
      background: transparent; color: hsl(var(--muted-foreground));
      cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .close-btn:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }
  `],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="modal-head">
          <div style="display:flex;align-items:center;gap:11px">
            <div style="width:38px;height:38px;border-radius:50%;background:hsl(217 91% 60% / 0.12);
              display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <z-icon zType="pencil" style="width:18px;height:18px;color:hsl(217 91% 60%)" />
            </div>
            <div>
              <p style="font-size:17px;font-weight:700;margin:0;color:hsl(var(--foreground))">Edit Event</p>
              <p style="font-size:12px;margin:0;color:hsl(var(--muted-foreground));
                max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                {{ event().title }}
              </p>
            </div>
          </div>
          <button class="close-btn" (click)="onClose()">
            <z-icon zType="x" style="width:16px;height:16px" />
          </button>
        </div>

        @if (loading()) {
          <div style="display:flex;align-items:center;justify-content:center;padding:60px">
            <z-icon zType="loader" class="w-8 h-8 animate-spin text-primary" />
          </div>
        } @else if (eventForm) {
          <form [formGroup]="eventForm" (ngSubmit)="onSubmit()">
            <div class="modal-body">

              <div class="field">
                <label class="field-label">Event Title <span class="req">*</span></label>
                <input z-input type="text" formControlName="title" style="width:100%" />
              </div>

              <div class="field">
                <label class="field-label">Description <span class="req">*</span></label>
                <textarea z-input formControlName="description" rows="3" style="width:100%;resize:none"></textarea>
              </div>

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

              <div class="row2">
                <div class="field">
                  <label class="field-label">Event Type</label>
                  <select z-input formControlName="event_type" style="width:100%">
                    <option [value]="0">In-Person</option>
                    <option [value]="1">Online</option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Category <span class="req">*</span></label>
                  <select z-input formControlName="categoryId" style="width:100%">
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
              </div>

              @if (!isOnline()) {
                <div class="row2">
                  <div class="field">
                    <label class="field-label">City</label>
                    <input z-input type="text" formControlName="city" style="width:100%" />
                  </div>
                  <div class="field">
                    <label class="field-label">Region</label>
                    <input z-input type="text" formControlName="region" style="width:100%" />
                  </div>
                </div>
              } @else {
                <div class="field">
                  <label class="field-label">Online URL</label>
                  <input z-input type="url" formControlName="online_url" style="width:100%" />
                </div>
              }

              <div class="field">
                <label class="field-label">Event Image URL</label>
                <input z-input type="url" formControlName="event_img_url" style="width:100%" />
              </div>

            </div>

            <div class="modal-foot">
              <button z-button zType="outline" type="button" (click)="onClose()" [disabled]="submitting()">
                Cancel
              </button>
              <button z-button zType="default" type="submit" [disabled]="submitting()">
                @if (submitting()) {
                  <z-icon zType="loader" class="w-4 h-4 mr-2 animate-spin" />Saving...
                } @else {
                  <z-icon zType="save" class="w-4 h-4 mr-2" />Save Changes
                }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class EditEventModalComponent implements OnInit {
  event = input.required<EventModel>();

  // ✅ Emits the fully merged updated event (with category/org preserved)
  updated = output<EventModel>();
  close = output<void>();

  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  eventForm!: FormGroup;
  categories = signal<Category[]>([]);
  loading = signal(false);
  submitting = signal(false);
  isOnline = signal(false);

  ngOnInit() { this.initForm(); this.loadCategories(); }

  private initForm() {
    const e = this.event();
    this.isOnline.set(e.event_type === EventType.Online);
    this.eventForm = this.fb.group({
      title:         [e.title,             [Validators.required, Validators.minLength(3)]],
      description:   [e.description,       Validators.required],
      start_time:    [this.toLocal(e.start_time), Validators.required],
      end_time:      [this.toLocal(e.end_time),   Validators.required],
      event_type:    [e.event_type,        Validators.required],
      categoryId:    [e.categoryId,        Validators.required],
      city:          [e.city      ?? ''],
      region:        [e.region    ?? ''],
      online_url:    [e.online_url  ?? ''],
      event_img_url: [e.event_img_url ?? ''],
    });
    this.eventForm.get('event_type')?.valueChanges.subscribe((v) => {
      this.isOnline.set(Number(v) === EventType.Online);
      this.updateValidators();
    });
    this.updateValidators();
  }

  private toLocal(d: string): string {
    const dt = new Date(d);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
  }

  private updateValidators() {
    const c = this.eventForm.get('city')!;
    const r = this.eventForm.get('region')!;
    const u = this.eventForm.get('online_url')!;
    if (this.isOnline()) {
      c.clearValidators(); r.clearValidators();
      u.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
    } else {
      c.setValidators(Validators.required); r.setValidators(Validators.required);
      u.clearValidators();
    }
    [c, r, u].forEach((ctrl) => ctrl.updateValueAndValidity());
  }

  private loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (d) => this.categories.set(d),
      error: () => toast.error('Failed to load categories'),
    });
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      toast.error('Please fill in all required fields');
      return;
    }
    const org = this.authService.getOrganization();
    if (!org) { toast.error('Organization not found'); return; }

    this.submitting.set(true);
    const v = this.eventForm.value;
    const newCategoryId = Number(v.categoryId);

    const dto: UpdateEventDto = {
      title:         v.title,
      description:   v.description,
      event_img_url: v.event_img_url || '',
      start_time:    new Date(v.start_time).toISOString(),
      end_time:      new Date(v.end_time).toISOString(),
      event_type:    Number(v.event_type),
      city:          v.city        || '',
      region:        v.region      || '',
      online_url:    v.online_url  || '',
      categoryId:    newCategoryId,
      organizationId: org.id,
    };

    this.eventService.updateEvent(this.event().id, dto).subscribe({
      next: () => {
        toast.success('Event updated!');
        this.submitting.set(false);

        // ✅ Find the selected category object from our local list
        const selectedCat = this.categories().find((c) => c.id === newCategoryId) ?? null;

        // ✅ Merge form values back onto the original event — preserving
        //    organization & other relations the API strips on update response
        const mergedEvent: EventModel = {
          ...this.event(),         // keep original relations (organization, etc.)
          title:         v.title,
          description:   v.description,
          event_img_url: v.event_img_url || null,
          start_time:    new Date(v.start_time).toISOString(),
          end_time:      new Date(v.end_time).toISOString(),
          event_type:    Number(v.event_type),
          city:          v.city        || null,
          region:        v.region      || null,
          online_url:    v.online_url  || null,
          categoryId:    newCategoryId,
          category:      selectedCat,  // ✅ inject category object from local list
          organizationId: org.id,
        };

        this.updated.emit(mergedEvent);
      },
      error: (err) => {
        this.submitting.set(false);
        toast.error(err?.error?.message || 'Failed to update event');
      },
    });
  }

  onClose() { this.close.emit(); }
}