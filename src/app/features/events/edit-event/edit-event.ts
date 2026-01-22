// src/app/features/events/edit-event/edit-event.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '@core/services/event.service';
import { CategoryService } from '@core/services/category';
import { OrganizationService } from '@core/services/organization.service';
import {
  UpdateEventDto,
  EventType,
  Event as EventModel,
} from '@core/models/event.model';
import { Category } from '@core/services/category';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-event',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardIconComponent,
    ZardDividerComponent,
  ],
  templateUrl: './edit-event.html',
  standalone: true,
})
export class EditEventComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private categoryService = inject(CategoryService);
  private organizationService = inject(OrganizationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  eventForm!: FormGroup;
  categories = signal<Category[]>([]);
  loading = signal(false);
  isOnline = signal(false);
  organizationId = signal<number | null>(null);
  organizationName = signal<string>('');
  eventId = signal<number | null>(null);
  currentEvent = signal<EventModel | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(+id);
      this.loadEventData();
    } else {
      this.router.navigate(['/events']);
    }
  }

  private loadEventData() {
    this.loading.set(true);

    const cachedOrg = this.organizationService.getCachedOrganization();
    if (cachedOrg) {
      this.organizationId.set(cachedOrg.id);
      this.organizationName.set(cachedOrg.name);
    }

    this.eventService.getEventById(this.eventId()!).subscribe({
      next: (event) => {
        this.currentEvent.set(event);
        this.isOnline.set(event.event_type === EventType.Online);
        this.initForm(event);
        this.loadCategories();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load event:', err);
        this.router.navigate(['/events']);
      },
    });
  }

  private initForm(event: EventModel) {
    this.eventForm = this.fb.group({
      title: [event.title, [Validators.required, Validators.minLength(3)]],
      description: [event.description, [Validators.required]],
      start_time: [
        this.formatDateTimeLocal(event.start_time),
        [Validators.required],
      ],
      end_time: [
        this.formatDateTimeLocal(event.end_time),
        [Validators.required],
      ],
      event_type: [event.event_type, [Validators.required]],
      categoryId: [event.categoryId, [Validators.required]],
      city: [event.city || ''],
      region: [event.region || ''],
      online_url: [event.online_url || ''],
      event_img_url: [event.event_img_url || ''],
    });

    this.eventForm.get('event_type')?.valueChanges.subscribe((value) => {
      this.isOnline.set(value === EventType.Online);
      this.updateValidators();
    });

    this.updateValidators();
  }

  private formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  updateValidators() {
    const cityControl = this.eventForm.get('city');
    const regionControl = this.eventForm.get('region');
    const onlineUrlControl = this.eventForm.get('online_url');

    if (this.isOnline()) {
      cityControl?.clearValidators();
      regionControl?.clearValidators();
      onlineUrlControl?.setValidators([
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/),
      ]);
    } else {
      cityControl?.setValidators([Validators.required]);
      regionControl?.setValidators([Validators.required]);
      onlineUrlControl?.clearValidators();
    }

    cityControl?.updateValueAndValidity();
    regionControl?.updateValueAndValidity();
    onlineUrlControl?.updateValueAndValidity();
  }

  loadCategories() {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  onSubmit() {
    if (this.eventForm.invalid || this.eventId() === null) {
      Object.keys(this.eventForm.controls).forEach((key) => {
        this.eventForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading.set(true);
    const formValue = this.eventForm.value;

    const dto: UpdateEventDto = {
      title: formValue.title,
      description: formValue.description,
      event_img_url: formValue.event_img_url || null,
      start_time: new Date(formValue.start_time).toISOString(),
      end_time: new Date(formValue.end_time).toISOString(),
      event_type: formValue.event_type,
      city: formValue.city || null,
      region: formValue.region || null,
      online_url: formValue.online_url || null,
      categoryId: formValue.categoryId,
    };

    console.log('📤 Sending update for event ID:', this.eventId());
    console.log('📦 Update DTO:', dto);

    this.eventService.updateEvent(this.eventId()!, dto).subscribe({
      next: (updatedEvent) => {
        this.loading.set(false);
        console.log('✅ Event updated successfully:', updatedEvent);
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('❌ Failed to update event:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.error?.message || err.message,
          errors: err.error?.errors,
          fullError: err.error,
        });
        // TODO: Show user-friendly error message
        alert('Failed to update event. Check console for details.');
      },
    });
  }
  cancel() {
    this.router.navigate(['/events']);
  }
}
