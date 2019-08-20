import {Component} from '@angular/core'
import {HttpClient} from '@angular/common/http'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public data

  constructor(
    private readonly http: HttpClient
  ) {
    this.data = this.getData()
  }

  getData = () =>
    this.http
      .get<any[]>('https://jsonplaceholder.typicode.com/posts')


  public dataChanged($event): void {
    console.log('commit', $event)
  }
}

