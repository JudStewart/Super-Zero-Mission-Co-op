import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import {MatToolbarModule} from '@angular/material/toolbar';
import {MatFormFieldModule} from '@angular/material/form-field'
import {MatInputModule} from '@angular/material/input';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';

import {HttpClientModule} from '@angular/common/http'

import { HomeComponent } from './home/home.component';
import { SuperMetroidComponent } from './super-metroid/super-metroid.component';
import { ZeroMissionComponent } from './zero-mission/zero-mission.component';
import { SocketTestingComponent } from './socket-testing/socket-testing.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SuperMetroidComponent,
    ZeroMissionComponent,
    SocketTestingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSelectModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
