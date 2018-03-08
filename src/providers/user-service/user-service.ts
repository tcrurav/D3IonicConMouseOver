import { Http } from '@angular/http';
import { Injectable } from '@angular/core';

/*
  Generated class for the UserServiceProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UserServiceProvider {

  constructor(public http: Http) {
  }

  getGrafica = () => {   
    return this.http.get("https://www.quandl.com/api/v3/datasets/EOD/V.json?api_key=WjuVsRMfe9rGgXHrHWJk");    
  }
}
