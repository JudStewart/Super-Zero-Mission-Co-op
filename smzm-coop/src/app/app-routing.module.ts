import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { SocketTestingComponent } from './socket-testing/socket-testing.component'
import { SuperMetroidComponent } from './super-metroid/super-metroid.component';
import { ZeroMissionComponent } from './zero-mission/zero-mission.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'SuperMetroid', component: SuperMetroidComponent},
  {path: 'ZeroMission', component: ZeroMissionComponent},
  {path: 'Debug', component: SocketTestingComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
