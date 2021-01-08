import { DateTime, Duration, Interval } from "luxon"
import { Pax } from "src/core/usePax"

export enum UserDayStates {
  PendingReview = "PENDING_REVIEW",
  Confirmed = "CONFIRMED",
}

export enum ReservationKinds {
  Coworking = "COWORKING",
  Coliving = "COLIVING",
}

export enum GlobalDayStates {
  Disabled,
}

export interface TUserDay {
  on: any
  kind: ReservationKinds
  status: UserDayStates
}

export type TMapDays = Map<number, TUserDay>
export type TMapGlobalDays = Map<number, GlobalDayStates>

export class TCalendarContext {
  userDays!: TMapDays
  setUserDays!: (arg0: TMapDays) => void

  globalDays!: TMapGlobalDays
  setGlobalDays!: (arg0: TMapGlobalDays) => void

  isLoading!: boolean

  pax!: Pax

  public constructor(init?: Partial<TCalendarContext>) {
    Object.assign(this, init)
  }

  isDisabledDay(dt: DateTime) {
    let ds = this.globalDays.get(dt.toMillis())
    return ds === GlobalDayStates.Disabled
  }
}
