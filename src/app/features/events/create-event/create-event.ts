// src/app/features/events/create-event/create-event.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { toast } from 'ngx-sonner';

import { EventService } from '@core/services/event.service';
import { CategoryService, Category } from '@core/services/category';
import { AuthService } from '@core/services/auth.service';
import { CreateEventDto } from '@core/models/event.model';

import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardIconComponent } from '@shared/components/icon/icon.component';
import { type ZardIcon } from '@shared/components/icon/icons';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';

@Component({
  selector: 'app-create-event',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardCardComponent,
    ZardIconComponent,
    ZardDividerComponent,
  ],
  templateUrl: './create-event.html',
  standalone: true,
})
export class CreateEventComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private eventService = inject(EventService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService); // ✅ Use AuthService instead

  eventForm!: FormGroup;
  categories = signal<Category[]>([]);
  loading = signal(false);
  organizationName = signal<string>('');
  organizationId = signal<number | null>(null);

  readonly icons = {
    loader: 'loader' as ZardIcon,
    info: 'info' as ZardIcon,
    calendar: 'calendar' as ZardIcon,
    mapPin: 'map-pin' as ZardIcon,
    folder: 'folder' as ZardIcon,
    x: 'x' as ZardIcon,
    save: 'save' as ZardIcon,
    clock: 'clock' as ZardIcon,
    users: 'users' as ZardIcon,
    dollarSign: 'dollar-sign' as ZardIcon,
    plus: 'plus' as ZardIcon,
    trash: 'trash-2' as ZardIcon,
    image: 'image' as ZardIcon,
    upload: 'upload' as ZardIcon,
    ticket: 'ticket' as ZardIcon,
    userPlus: 'user-plus' as ZardIcon,
    link: 'link' as ZardIcon,
  };

  isOnline = computed(() => this.eventForm?.get('event_type')?.value === 1);

  ngOnInit() {
    this.loadOrganizationInfo();
    this.loadCategories();
    this.initForm();
  }

  // ✅ Fixed: Use AuthService to get organization
  private loadOrganizationInfo() {
    const org = this.authService.getOrganization();
    if (org) {
      this.organizationName.set(org.name);
      this.organizationId.set(org.id);
    } else {
      toast.error('Organization not found. Please log in again.');
      this.router.navigate(['/']);
    }
  }

  private loadCategories() {
    this.loading.set(true);
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        toast.error('Failed to load categories');
        this.loading.set(false);
      },
    });
  }

  private initForm() {
    const orgId = this.organizationId();
    if (!orgId) {
      toast.error('Organization not found');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      event_img_url: [''],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      event_type: [0, Validators.required],
      city: ['', Validators.required],
      region: ['', Validators.required],
      online_url: [''],
      categoryId: [null, Validators.required],
      organizationId: [orgId],
    });

    // ✅ Add date range validator
    // this.eventForm.setValidators(this.dateRangeValidator);

    // ✅ Dynamic validation based on event type
    this.eventForm.get('event_type')?.valueChanges.subscribe((type) => {
      this.updateLocationValidators(type);
    });
  }

  // ✅ Date range validator
  private dateRangeValidator = (group: FormGroup) => {
    const start = group.get('start_time')?.value;
    const end = group.get('end_time')?.value;

    if (start && end && new Date(start) >= new Date(end)) {
      return { dateRange: true };
    }
    return null;
  };

  // ✅ Update validators based on event type
  private updateLocationValidators(type: number) {
    const cityControl = this.eventForm.get('city');
    const regionControl = this.eventForm.get('region');
    const onlineUrlControl = this.eventForm.get('online_url');

    if (type === 1) {
      // Online event
      cityControl?.clearValidators();
      regionControl?.clearValidators();
      onlineUrlControl?.setValidators([
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/),
      ]);
    } else {
      // In-person event
      cityControl?.setValidators(Validators.required);
      regionControl?.setValidators(Validators.required);
      onlineUrlControl?.clearValidators();
    }

    cityControl?.updateValueAndValidity();
    regionControl?.updateValueAndValidity();
    onlineUrlControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();

      // ✅ Show specific error messages
      if (this.eventForm.errors?.['dateRange']) {
        toast.error('End time must be after start time');
      } else {
        toast.error('Please fill in all required fields');
      }
      return;
    }

    this.loading.set(true);
    const formValue = this.eventForm.value;

    // ✅ Convert datetime-local to ISO string
    const dto: CreateEventDto = {
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
      organizationId: formValue.organizationId,
    };

    this.eventService.createEvent(dto).subscribe({
      next: () => {
        toast.success('Event created successfully!');
        this.router.navigate(['/events']);
      },
      error: (err) => {
        console.error('Error creating event:', err);
        this.loading.set(false);
        // Error is handled by interceptor
      },
    });
  }

  cancel() {
    this.router.navigate(['/events']);
  }
}
