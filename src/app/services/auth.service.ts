import { effect, inject, Injectable, signal } from '@angular/core';
import { Auth, getAuth, GoogleAuthProvider, signInWithPopup, signOut, User, user } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth)

  user = toSignal(user(this.auth), { initialValue: null });
  token = signal(localStorage.getItem('access_token') || '');
  refreshToken = signal(localStorage.getItem('refresh_token') || '');

  constructor() { }

  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    // provider.setCustomParameters({
    //   access_type: 'offline',
    //   prompt: 'consent'
    // });
    signInWithPopup(this.auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken || '';
        // const refreshToken = credential?.refreshToken || ''; // This is where you get the refresh token

        // Store tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        // localStorage.setItem('refresh_token', refreshToken);

        // Set the signals
        this.token.set(accessToken);
        console.log(credential);


      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  }

  logoutFromGoogle() {
    signOut(this.auth).then(() => {
      this.token.set('');
      localStorage.removeItem('access_token');
    }).catch((error) => {
      console.error('Logout failed:', error);
    });
  }

}
