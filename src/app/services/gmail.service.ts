import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { bufferCount, catchError, concatMap, delay, forkJoin, from, map, Observable, of, reduce, switchMap, toArray } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GmailService {

  constructor() { }

  private http = inject(HttpClient);

  fetchRecentEmails() {
    // const user = await this.authService.getCurrentUser();
    // const query = 'subject:(job application OR applied OR interview) newer_than:90d';
    // const query = `label:inbox OR label:work/jobs-applied OR label:work/jobs-rejected subject:(job application OR applied OR interview) newer_than:90d`;
    // const query = `label:inbox OR label:work/Jobs-appliede OR label:work/Jobs-rejectede subject:(application OR applied OR interview OR thank you)`;
    const query = `label:inbox OR label:work/Jobs-appliede OR label:work/Jobs-rejectede subject:(application OR applied OR interview OR("thank you" AND(applying OR application)))`;
    // Make max-rsults to 250 once testing is complteted and solve issue of https://gmail.googleapis.com/gmail/v1/users/me/messages/1958edc2a2745c86 429 (Too Many Requests)
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=250`
    // const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10`
    // const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`
    return this.http.get(url).pipe(
      switchMap((data: any) => {
        console.warn("in service fetch")
        if (!data.messages || data.messages.length === 0) {
          return of([]);
        }
        const messageIds = data.messages.map((msg: { id: any; }) => msg.id);
        const useBatch = messageIds.length > 20;
        return useBatch
          ? this.batchFetchEmailDetails(messageIds, 50)
          : forkJoin(messageIds.map((id: string) => this.fetchEmailDetails(id)));

      }), catchError((error) => {
        console.error('Error fetching emails:', error);
        throw error; // Prevent crash and return empty array
      }))
  }

  // batchFetchEmailDetails(messageIds: string[], batchSize: number): Observable<any[]> {
  //   return from(messageIds).pipe(
  //     bufferCount(batchSize),
  //     concatMap((batch, batchIndex) =>
  //     // forkJoin(batch.map(id => this.fetchEmailDetails(id))).pipe(
  //     //   delay(index * 500)
  //     // )
  //       
  //     ),
  //     reduce<any[], any[]>((all, batch) => [...all, ...batch], [])
  //   );
  // }

  batchFetchEmailDetails(messageIds: string[], batchSize: number): Observable<any[]> {
    return from(messageIds).pipe(
      bufferCount(batchSize), // Break into batches
      concatMap((batch, batchIndex) =>
        // Throttle each request within the batch (one every 200ms)
        from(batch).pipe(
          concatMap((id, i) => this.fetchEmailDetails(id).pipe(delay(i * 100))),
          toArray(), // Gather the batch results
          delay(batchIndex * 50) // Delay before starting next batch
        )
      ),
      reduce<any[], any[]>((all, batch) => [...all, ...batch], [])
    );
  }


  fetchEmailDetails(messageId: string,) {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`;
    return this.http.get(url).pipe(
      map((data: any) => {
        // console.log(data);

        const snippet = data.snippet;
        const payload = data.payload;
        const headersList = payload?.headers || [];
        const subject = this.getHeader(headersList, 'Subject');
        const from = this.getHeader(headersList, 'From');
        const date = this.getHeader(headersList, 'Date');
        const parsedEmail = this.parseJobEmail(subject, from)
        return {
          messageId: messageId,
          snippet,
          subject,
          from,
          applicationDate: date || new Date(),
          status: 'Applied',
          receivedAt: new Date().toISOString(),
          companyName: parsedEmail.companyName,
          jobTitle: parsedEmail.jobTitle,
          source: this.inferSource(from),
          notes: '',
        };
      }),
      catchError((error) => {
        console.error('Error fetching courses:', error);
        throw error;
      }))
  }

  parseJobEmail(emailSnippet: string, emailFrom: any) {
    const lowerText = emailSnippet.toLowerCase();
    let companyName = 'Unknown'
    const companyMatch = lowerText.match(/(?:applying at|position with|application with|application for|application of|interest in|sent to|interest|with|at)\s+([\w&\.\-\s\(\)\|\/]+)/i);
    if (companyMatch && companyMatch[1]) {
      companyName = companyMatch[1].trim();
    } else {
      const fromMatch = emailFrom?.match(/@([a-zA-Z0-9-]+)\./);
      companyName = fromMatch[1].trim()
    }
    const jobTitleMatch = lowerText.match(/(position of|position for|application for|role of|interest in|application to)\s(.+?)(\.|\!|\n)/);
    const match = lowerText.match(/for (the )?(?<title>.+?) role(\.|\!|\n)/);
    const jobTitle = jobTitleMatch ? jobTitleMatch[2].trim() : match ? match[2].trim() : 'Frontend Developer';
    return { companyName: this.capitalize(companyName), jobTitle };
  }

  capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  inferSource(from: string): string {
    if (from.includes('linkedin')) return 'LinkedIn';
    if (from.includes('greenhouse')) return 'Greenhouse';
    if (from.includes('noreply')) return 'Email';
    return 'Website';
  }

  private getHeader(headers: any[], name: string): string {
    const found = headers.find(h => h.name === name);
    return found ? found.value : '';
  }
}



/*
 HttpErrorResponse {headers: _HttpHeaders, status: 429, statusText: 'OK', url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/1958edc2a2745c86', ok: false, …}
error
:
error
:
code
:
429
errors
:
[{… }]
message
:
"Too many concurrent requests for user."
status
:
"RESOURCE_EXHAUSTED"
[[Prototype]]
:
Object
[[Prototype]]
:
Object
headers
:
_HttpHeaders
lazyInit
:
() => {… }
length
:
0
name
:
""
arguments
:
(...)
caller
:
(...)
[[FunctionLocation]]
:
http.mjs: 61
[[Prototype]]
:
ƒ()
[[Scopes]]
:
Scopes[4]
lazyUpdate
:
null
normalizedNames
:
Map(0) { size: 0 }
[[Prototype]]
:
Object
message
:
"Http failure response for https://gmail.googleapis.com/gmail/v1/users/me/messages/1958edc2a2745c86: 429 OK"
name
:
"HttpErrorResponse"
ok
:
false
status
:
429
statusText
:
"OK"
url
:
"https://gmail.googleapis.com/gmail/v1/users/me/messages/1958edc2a2745c86"
*/