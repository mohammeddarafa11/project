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
import { AuthService } from '@core/services/auth.service'; // ✅ Use AuthService instead
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
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';

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
  private authService = inject(AuthService); // ✅ Use AuthService
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

  readonly icons = {
    loader: 'loader' as ZardIcon,
    info: 'info' as ZardIcon,
    calendar: 'calendar' as ZardIcon,
    mapPin: 'map-pin' as ZardIcon,
    folder: 'folder' as ZardIcon,
    x: 'x' as ZardIcon,
    save: 'save' as ZardIcon,
  };

  ngOnInit() {
    // ✅ First check authentication
    if (
      !this.authService.isAuthenticated() ||
      !this.authService.isOrganizer()
    ) {
      toast.error('You must be logged in as an organizer to edit events');
      this.router.navigate(['/']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eventId.set(+id);
      this.loadEventData();
    } else {
      toast.error('Invalid event ID');
      this.router.navigate(['/events']);
    }
  }

  private loadEventData() {
    this.loading.set(true);

    // ✅ Get organization from AuthService
    const org = this.authService.getOrganization();

    if (!org) {
      toast.error('Organization not found. Please login again.');
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }

    this.organizationId.set(org.id);
    this.organizationName.set(org.name);

    console.log('✅ Loaded organization for editing:', org);

    // Load event data
    this.eventService.getEventById(this.eventId()!).subscribe({
      next: (event) => {
        // ✅ Verify this event belongs to the current organization
        if (event.organizationId !== org.id) {
          toast.error('You do not have permission to edit this event');
          this.router.navigate(['/events']);
          return;
        }

        this.currentEvent.set(event);
        this.isOnline.set(event.event_type === EventType.Online);
        this.initForm(event);
        this.loadCategories();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load event:', err);
        toast.error('Failed to load event');
        this.loading.set(false);
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
      error: (err) => {
        console.error('Error loading categories:', err);
        toast.error('Failed to load categories');
      },
    });
  }

  onSubmit() {
    // Validate form
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      toast.error('Please fill in all required fields correctly');
      return;
    }

    const orgId = this.organizationId();
    if (orgId === null) {
      toast.error('Organization ID is missing. Please login again.');
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }

    const evtId = this.eventId();
    if (evtId === null) {
      toast.error('Event ID is missing');
      return;
    }

    this.loading.set(true);
    const formValue = this.eventForm.value;

    // ✅ Build DTO with organizationId from auth
    const dto: UpdateEventDto = {
      title: formValue.title,
      description: formValue.description,
      event_img_url: formValue.event_img_url || '',
      start_time: new Date(formValue.start_time).toISOString(),
      end_time: new Date(formValue.end_time).toISOString(),
      event_type: formValue.event_type,
      city: formValue.city || '',
      region: formValue.region || '',
      online_url: formValue.online_url || '',
      categoryId: formValue.categoryId,
      organizationId: orgId, // ✅ From AuthService
    };

    console.log('📤 Updating event ID:', evtId);
    console.log('📦 Update DTO:', dto);

    this.eventService.updateEvent(evtId, dto).subscribe({
      next: (updatedEvent) => {
        this.loading.set(false);
        console.log('✅ Event updated successfully:', updatedEvent);
        toast.success('Event updated successfully!');
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('❌ Failed to update event:', err);

        const errorMsg =
          err.error?.message || err.message || 'Failed to update event';
        toast.error(errorMsg);
      },
    });
  }

  cancel() {
    this.router.navigate(['/events']);
  }
}
