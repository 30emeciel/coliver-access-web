import { DateTime, Duration, Interval } from "luxon";

export enum UserDayStates {
    PendingReview = "PENDING_REVIEW",
    Coworking = "COWORKING",
    Coliving = "COLIVING",
  }

  export enum GlobalDayStates {    
    Disabled,
  }

export type TMapDays = Map<number, UserDayStates>
export type TMapGlobalDays = Map<number, GlobalDayStates>

export class TCalendarContext {
    userDays!: TMapDays
    setUserDays!: (arg0: TMapDays) => void

    globalDays!: TMapGlobalDays
    setGlobalDays!: (arg0: TMapGlobalDays) => void

    isLoading!: boolean

    
    public constructor(init?: Partial<TCalendarContext>) {
        Object.assign(this, init);
    }

    isDisabledDay(dt:DateTime) {
        let ds = this.globalDays.get(dt.toMillis())
        return ds === GlobalDayStates.Disabled
    }

  }

