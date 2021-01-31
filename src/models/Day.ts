import { DateTime } from "luxon"
import admin from "firebase"
import { TReservationRequest } from "./ReservationRequest"
import myfirebase from "src/core/myfirebase"
import { dtFromFirestore, makePartialData, optionalDtToFirestore } from "./utils"

export enum TDayState {
  "PENDING_REVIEW" = "PENDING_REVIEW",
  "CONFIRMED" = "CONFIRMED"
}
export enum TDayKind {
  "COLIVING" = "COLIVING",
  "COWORKING" = "COWORKING"
}

export interface TDay {
  on: DateTime
  kind: TDayKind
  state: TDayState
  request?: myfirebase.firestore.DocumentReference<TReservationRequest>
}

export const TDayConverter: admin.firestore.FirestoreDataConverter<TDay> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)!

    return {
      on: dtFromFirestore(data.on),
      state: data.state,
      kind: data.kind,
      request: data.request
    }
  },
  toFirestore: (entity: Partial<TDay>) => {
    return makePartialData({
      on: optionalDtToFirestore(entity.on),
      kind: entity.kind,
      state: entity.state,
      request: entity.request
    })
  },
}
