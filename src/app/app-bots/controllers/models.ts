import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

export enum ControllerType {
  START_LONG,
  LONGING
}

export interface TaskController {
  type : ControllerType;
  status: BehaviorSubject<string>;
  destroy(): void;
}
