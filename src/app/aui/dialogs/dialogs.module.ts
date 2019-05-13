import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotEditComponent } from './bot-edit/bot-edit.component';
import {MatDialogModule} from '@angular/material';
import {MaterialAppModule} from '../material/material-app.module';
import {FormsModule} from '@angular/forms';
import { StopLossEditComponent } from './stop-loss-edit/stop-loss-edit.component';
import { OrderTypeComponent } from './order-type/order-type.component';

@NgModule({
  declarations: [BotEditComponent, StopLossEditComponent, OrderTypeComponent],
  imports: [
    CommonModule,
    MaterialAppModule,
    FormsModule
  ],
  entryComponents: [
    BotEditComponent,
    StopLossEditComponent,
    OrderTypeComponent
  ]
})
export class DialogsModule { }
