import { HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError } from "rxjs/operators";
import { throwError } from "rxjs";

export function HttpIntercept(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const authService = inject(AuthService);
    // console.log(authService.token());

    req = req.clone({
        setHeaders: {
            Authorization: `Bearer ${authService.token()}`
        }
    })
    return next(req).pipe(
        catchError(error => {
            console.error('HTTP Intercepted Error:', error);
            return throwError(() => error);
        })
    );
}