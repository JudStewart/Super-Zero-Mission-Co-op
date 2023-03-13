import { Injectable } from '@angular/core';
import { map, Observable, Subject } from 'rxjs'
import { HttpClient} from '@angular/common/http'
import { Socket } from 'ngx-socket-io'

export interface Message {
  date: Date
  from: UserDetail,
  to: UserDetail,
  content: string
}

export interface UserDetail {
  sid: number
  name: string
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  messages: Message[] = []
  luaClient = new Subject<UserDetail>()
  
  constructor(private socket: Socket) {}
  
  sendMessage(message: Message) {
    this.socket.emit('message', message)
  }
  
  getMessage() {
    return this.socket.fromEvent('message').pipe(map((data: any) => data))
  }
  
  getUsers() {
    return this.socket.fromEvent('current_users').pipe(map((data: any) => data))
  }
  
}
