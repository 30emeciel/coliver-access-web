import admin from "firebase"
import { DateTime } from "luxon"
import {
  dtFromFirestore,
  dtToFirestore,
  makePartialData,
  optionalDtFromFirestore,
  optionalDtToFirestore,
} from "./utils"


export enum TReservationRequestState {
  "PENDING_REVIEW" = "PENDING_REVIEW",
  "CONFIRMED" = "CONFIRMED"
}

export enum TReservationRequestKind {
  "COLIVING" = "COLIVING",
  "COWORKING" = "COWORKING"
}

export interface TReservationRequest {
  id?: string
  paxId: string
  created?: DateTime
  kind: TReservationRequestKind
  state: TReservationRequestState
  arrivalDate: DateTime
  departureDate?: DateTime
  numberOfNights?: number
}

export const TReservationRequestConverter: admin.firestore.FirestoreDataConverter<TReservationRequest> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)!

    return {
      paxId: snapshot.ref.parent!.parent!.id,
      created: dtFromFirestore(data.created),
      state: data.state,
      arrivalDate: dtFromFirestore(data.arrival_date),
      departureDate: optionalDtFromFirestore(data.departure_date),
      kind: data.kind,
      numberOfNights: data.number_of_nights,
    }
  },
  toFirestore: (entity: Partial<TReservationRequest>) => {
    return makePartialData({
      created: admin.firestore.FieldValue.serverTimestamp(),
      kind: entity.kind,
      state: entity.state ,
      arrival_date: optionalDtToFirestore(entity.arrivalDate),
      departure_date: optionalDtToFirestore(entity.departureDate),
      number_of_nights: entity.numberOfNights,
    })
  },
}
