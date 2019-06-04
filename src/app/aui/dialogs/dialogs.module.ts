import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotEditComponent } from './bot-edit/bot-edit.component';
import {MatDialogModule} from '@angular/material';
import {MaterialAppModule} from '../material/material-app.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { StopLossEditComponent } from './stop-loss-edit/stop-loss-edit.component';
import { OrderTypeComponent } from './order-type/order-type.component';
import {PipesModule} from '../pipes/pipes.module';

@NgModule({
  declarations: [BotEditComponent, StopLossEditComponent, OrderTypeComponent],
  imports: [
    CommonModule,
    MaterialAppModule,
    FormsModule,
    ReactiveFormsModule,
    PipesModule
  ],
  entryComponents: [
    BotEditComponent,
    StopLossEditComponent,
    OrderTypeComponent
  ]
})
export class DialogsModule { }
