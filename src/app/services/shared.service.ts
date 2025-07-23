import { inject, Injectable, signal } from '@angular/core';
import { User } from '@angular/fire/auth';
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc } from '@angular/fire/firestore';
import { GmailService } from './gmail.service';
import { forkJoin, from, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private firestore = inject(Firestore)
  private gmailService = inject(GmailService)
  public appSignal = signal<any[]>([]);
  isLoadingSignal = signal<boolean>(false)

  constructor() { }


  getApplications(user: User): Observable<any[]> {
    console.log('We are in get applications method in shared service');
    const uid = user?.uid;
    const userRef = doc(this.firestore, `users/${uid}`);

    return from(getDoc(userRef)).pipe(
      switchMap(docSnap => {
        if (!docSnap.exists()) {
          console.log('Initial sync - fetching Gmail data');
          return this.gmailService.fetchRecentEmails().pipe(
            switchMap((emails: any) => {
              const saveUser$ = from(setDoc(userRef, {
                email: user?.email,
                displayName: user?.displayName,
                createdAt: Timestamp.now()
              }));
              const emailSaves$ = emails.map((email: any) => {
                if (!email.messageId) return of(null); // skip
                const docRef = doc(this.firestore, `users/${uid}/applications/${email.messageId}`);
                return from(setDoc(docRef, {
                  ...email,
                  receivedAt: Timestamp.now()
                }));
              });
              // Wait for all Firebase writes to finish
              return forkJoin([saveUser$, ...emailSaves$]).pipe(
                switchMap(() => {
                  const appsCollection = collection(this.firestore, `users/${uid}/applications`);
                  return from(getDocs(appsCollection)).pipe(
                    map(appsSnap => appsSnap.docs.map(doc => doc.data()))
                  );
                }));
            }));
        } else {
          // console.log('User already exists. Fetching existing applications');
          const appsCollection = collection(this.firestore, `users/${uid}/applications`);
          return from(getDocs(appsCollection)).pipe(
            map(appsSnap => {
              const apps = appsSnap.docs.map(doc => doc.data())
              this.appSignal.set(apps);
              return apps
            }));
        }
      }));
  }

  updateApplication(user: User, messageId: string, updatedData: any) {
    const appDoc = doc(this.firestore, `users/${user.uid}/applications/${messageId}`);
    return from(updateDoc(appDoc, updatedData));
  }

  archiveApplication(user: User, messageId: string, archivedData: any) {
    if (!user) return;
    const archiveRef = doc(this.firestore, `archives/${user.uid}/applications/${messageId}`)
    const sourceRef = doc(this.firestore, `users/${user.uid}/applications/${messageId}`);
    const archivedDataPayload = { ...archivedData, archivedDate: serverTimestamp() }
    const archiveSave$ = from(setDoc(archiveRef, archivedDataPayload));
    const delete$ = from(deleteDoc(sourceRef));
    return forkJoin([archiveSave$, delete$])
  }

  deleteApplication(user: User, messageId: string, deletedData: any) {
    if (!user) return
    const deleteRef = doc(this.firestore, `deleted/${user.uid}/applications/${messageId}`)
    const sourceRef = doc(this.firestore, `users/${user.uid}/applications/${messageId}`);
    const deletedDataPayload = { ...deletedData, deletedDate: serverTimestamp() }
    const deleteSave$ = from(setDoc(deleteRef, deletedDataPayload));
    const delete$ = from(deleteDoc(sourceRef));
    return forkJoin([deleteSave$, delete$])
  }


  syncLatestData(user: User) {
    // console.log('We are syncing data in shared service');
    return this.gmailService.fetchRecentEmails().pipe(
      switchMap((emails: any) => {
        const emailSaves$ = emails.map((email: any) => {
          if (!email.messageId) return of(null); // skip
          const docRef = doc(this.firestore, `users/${user.uid}/applications/${email.messageId}`);
          return from(setDoc(docRef, {
            ...email,
            receivedAt: Timestamp.now()
          }));
        });
        // Wait for all Firebase writes to finish
        return forkJoin(emailSaves$).pipe(
          switchMap(() => {
            const appsCollection = collection(this.firestore, `users/${user.uid}/applications`);
            return from(getDocs(appsCollection)).pipe(
              map(appsSnap => {
                const apps = appsSnap.docs.map(doc => doc.data())
                this.appSignal.set(apps);
                return apps
              }));
          }));
      }));
  }
}
