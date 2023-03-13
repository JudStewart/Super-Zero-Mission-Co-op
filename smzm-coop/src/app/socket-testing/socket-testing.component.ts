import { Component, OnInit, Input } from '@angular/core';
import { Message, UserDetail, WebsocketService } from '../websocket.service';
import * as io from 'socket.io-client'

@Component({
  selector: 'app-socket-testing',
  templateUrl: './socket-testing.component.html',
  styleUrls: ['./socket-testing.component.scss']
})
export class SocketTestingComponent implements OnInit {
  
  me: UserDetail = {
    sid: -1,
    name: "Web Client"
  }
  content: string = ''
  client: UserDetail | null = null
  users: any
  messages: Message[] = []
  
  constructor(private wsService: WebsocketService) {}
  
  ngOnInit(): void {
    this.wsService.getMessage().subscribe(message => {
      this.wsService.messages.push(message)
      this.messages = this.wsService.messages
    })
    
    this.wsService.luaClient.subscribe(user => {
      this.client = user
    })
    
    this.wsService.getUsers().subscribe(users => {
      console.log("Connected users: " + users)
      this.users = users
    })
  }
  
  sendMessage() {
    let message = {
      date: new Date(),
      from: this.me,
      to: this.client ?? {sid: -1, name: "General"},
      content: this.content
    }
    this.content = ''
    this.wsService.sendMessage(message)
  }
}
