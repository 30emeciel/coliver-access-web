import { DateTime } from "luxon"
import admin from "firebase"
import { TReservation, TReservationKind } from "./Reservation"
import myfirebase from "src/core/myfirebase"
import { dtFromFirestore, makePartialData, optionalDtFromFirestore, optionalDtToFirestore } from "./utils"

export enum TDayState {
  PENDING_REVIEW = "PENDING_REVIEW",
  CONFIRMED = "CONFIRMED"
}

export interface TDay {
  created?: DateTime,
  on: DateTime
  kind: TReservationKind
  state: TDayState
  request?: myfirebase.firestore.DocumentReference<TReservation>
}

export const TDayConverter: admin.firestore.FirestoreDataConverter<TDay> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)!

    return {
      created: optionalDtFromFirestore(data.created),
      on: dtFromFirestore(data.on),
      state: data.state,
      kind: data.kind,
      request: data.request
    }
  },
  toFirestore: (entity: Partial<TDay>) => {
    return makePartialData({
      created: admin.firestore.FieldValue.serverTimestamp(),
      on: optionalDtToFirestore(entity.on),
      kind: entity.kind,
      state: entity.state,
      request: entity.request
    })
  },
}
