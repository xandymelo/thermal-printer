import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoryEntry } from '../utils/history';

export interface PrintRequest {
  text: string;
  handle: string;
  private: boolean;
}

@Injectable({ providedIn: 'root' })
export class PrintApi {
  private http = inject(HttpClient);

  print(endpoint: string, body: PrintRequest): Observable<unknown> {
    return this.http.post(endpoint, body);
  }

  getHistory(endpoint: string): Observable<HistoryEntry[]> {
    return this.http.get<HistoryEntry[]>(endpoint);
  }
}
