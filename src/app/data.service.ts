import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/Observable';
import { Trade } from '../models/trade';

@Injectable()
export class DataService {

  constructor(private http: HttpClient) { }

  getTradeData(): Observable<Trade> {
    return this.http.get<Trade>('http://localhost:4200/assets/data.json');
  }

}
