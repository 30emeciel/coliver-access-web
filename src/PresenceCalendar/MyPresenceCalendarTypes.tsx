import { DateTime } from "luxon"
import { TPax } from "src/models/Pax"
import { TDay } from "../models/Day"

export enum GlobalDayStates {
  Disabled,
}


export type TMapDays = Map<number, TDay>
export type TMapGlobalDays = Map<number, GlobalDayStates>

export class TCalendarContext {
  userDays!: TMapDays
  setUserDays!: (arg0: TMapDays) => void

  globalDays!: TMapGlobalDays
  setGlobalDays!: (arg0: TMapGlobalDays) => void

  isLoading!: boolean

  pax!: TPax

  public constructor(init?: Partial<TCalendarContext>) {
    Object.assign(this, init)
  }

  isDisabledDay(dt: DateTime) {
    let ds = this.globalDays.get(dt.toMillis())
    return ds === GlobalDayStates.Disabled
  }
}
