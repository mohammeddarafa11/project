// src/app/core/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toast } from 'ngx-sonner';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error) {
        // Case 1: Backend sends a plain text string (like your screenshot)
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        // Case 2: Backend sends a JSON object (e.g., { message: "..." })
        else if (typeof error.error === 'object' && error.error.message) {
          errorMessage = error.error.message;
        }
      }

      // Show the toast
      toast.error(errorMessage, {
        // Optional: Add status code to description if you want context
        description: `Request failed (${error.status})`,
        duration: 4000,
      });

      return throwError(() => error);
    }),
  );
};
