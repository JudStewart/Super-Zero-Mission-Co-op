import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-zero-mission',
  templateUrl: './zero-mission.component.html',
  styleUrls: ['./zero-mission.component.scss']
})
export class ZeroMissionComponent implements OnInit {

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }
  
  connect()
  {
    let socket = new WebSocket("ws://localhost:9999")
    socket.onopen = function () {
      console.log("Successfully connected!")
    }
  }

}
