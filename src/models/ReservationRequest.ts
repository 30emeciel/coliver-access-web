import admin from "firebase"
import { DateTime } from "luxon"
import { dtFromFirestore, makePartialData, optionalDtFromFirestore, optionalDtToFirestore } from "./utils"
import db from "../core/db"
import { TDay, TDayConverter, TDayState } from "./Day"


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
    const data = snapshot.data(options)

    if (!snapshot.ref.parent?.parent?.id) {
      throw Error("request has no valid pax")
    }

    return {
      paxId: snapshot.ref.parent.parent.id,
      created: optionalDtFromFirestore(data.created),
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

export async function confirmReservation(reservation: TReservationRequest) {
  if (!reservation.id) {
    throw Error(`reservation.id is not defined`)
  }
  const batch = db.batch()
  const request_ref = db.doc(`pax/${reservation.paxId}/requests/${reservation.id}`)
    .withConverter(TReservationRequestConverter)

  const request_data: Partial<TReservationRequest> = {
    state: TReservationRequestState.CONFIRMED,
  }
  batch.set(request_ref, request_data, { merge: true })

  const daysQuerySnap = await db
    .collection(`pax/${reservation.paxId}/days`)
    .withConverter(TDayConverter)
    .where("request", "==", request_ref)
    .get()

  daysQuerySnap.forEach((docSnap) => {
    const data_update: Partial<TDay> = {
      state: TDayState.CONFIRMED,
    }
    batch.set(docSnap.ref, data_update, { merge: true })
  })

  await batch.commit()
}

export async function cancelReservation(reservation:TReservationRequest) {
  if (!reservation.id) {
    throw Error(`reservation.id is not defined`)
  }
  const batch = db.batch()
  const request_ref = db.doc(`pax/${reservation.paxId}/requests/${reservation.id}`)
    .withConverter(TReservationRequestConverter)
  batch.delete(request_ref)

  const daysQuerySnap = await db.collection(`pax/${reservation.paxId}/days`)
    .withConverter(TDayConverter)
    .where("request", "==", request_ref)
    .get()

  daysQuerySnap.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  await batch.commit()
}
