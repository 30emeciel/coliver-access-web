import admin from "firebase"
import { DateTime, Duration, Interval } from "luxon"
import { dtFromFirestore, makePartialData, optionalDtFromFirestore, optionalDtToFirestore } from "./utils"
import db from "src/core/db"
import { TDay, TDayConverter, TDayState } from "./Day"
import { Memoize } from "typescript-memoize"

export enum TReservationRequestState {
  PENDING_REVIEW = "PENDING_REVIEW",
  CONFIRMED = "CONFIRMED",
  CANCELED = "CANCELED"
}

export enum TReservationRequestKind {
  COLIVING = "COLIVING",
  COWORKING = "COWORKING"
}

export abstract class TReservation {

  constructor(paxId: string, arrivalDate: DateTime, id?: string) {
    this.id = id
    this.paxId = paxId
    this.arrivalDate = arrivalDate
  }

  id?: string
  paxId: string
  created?: DateTime
  state: TReservationRequestState = TReservationRequestState.PENDING_REVIEW
  arrivalDate: DateTime

  abstract get kind() : TReservationRequestKind

  get isEditable() {
    return true
  }
  get isCancelable() {
    return this.isEditable && this.state != TReservationRequestState.CANCELED
  }

  abstract toDescription():string

  abstract toRangeDays(): DateTime[]

  protected static fromBaseFirestore(snapshot: admin.firestore.DocumentSnapshot) {
    const data = snapshot.data()
    if (!data) {
      throw Error("request has invalid data")
    }
    const paxId = snapshot.ref.parent?.parent?.id
    if (!paxId) {
      throw Error("request has no valid pax")
    }
    return {
      id: snapshot.id,
      paxId: paxId,
      arrival_date: dtFromFirestore(data.arrival_date),
      rest: data,
    }
  }

  toFirestore(): { [p: string]: unknown } {
    return makePartialData({
      created: this.created ?? admin.firestore.FieldValue.serverTimestamp(),
      kind: this.kind,
      state: this.state ,
      arrival_date: optionalDtToFirestore(this.arrivalDate),
    })
  }

}

export class TColivingReservation extends TReservation {

  constructor(paxId: string, arrivalDate: DateTime, departureDate: DateTime, id?: string) {
    super(paxId, arrivalDate, id)
    this.departureDate = departureDate
  }

  protected static KIND = TReservationRequestKind.COLIVING
  departureDate: DateTime

  get kind() {
    return TColivingReservation.KIND
  }

  toDescription() {
    return `du ${this.arrivalDate.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)} au ${this.departureDate.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)} (${this.numberOfNights} nuits)`
  }

  toRangeDays(): DateTime[] {
    const oneDay = Duration.fromObject({ days: 1 })

    // Get all the days that contains the selected range
    const res: DateTime[] = []
    let i = this.arrivalDate.plus({}) // clone
    while (i <= this.departureDate) {
      res.push(i)
      i = i.plus(oneDay)
    }

    return res
  }

  @Memoize((r: TColivingReservation) => {
    return r.departureDate.toMillis() * r.arrivalDate.toMillis()
  })
  private static calculateNumberOfNights(r: TColivingReservation) {
    const interval = Interval.fromDateTimes(r.arrivalDate, r.departureDate)
    if (!interval.isValid) {
      throw Error("interval is not valid")
    }
    return interval.count("days") - 1
  }

  get numberOfNights() {
    return TColivingReservation.calculateNumberOfNights(this)
  }

  static supports(snapshot: admin.firestore.DocumentSnapshot) {
    const data = snapshot.data()
    return data && data.kind === TColivingReservation.KIND
  }

  static fromFirestore(snapshot: admin.firestore.DocumentSnapshot) {
    const data = TReservation.fromBaseFirestore(snapshot)

    return new TColivingReservation(
      data.paxId,
      data.arrival_date,
      dtFromFirestore(data.rest.departure_date),
      data.id,
    )
  }

  toFirestore() {
    const ret = super.toFirestore()
    return {...ret, ...makePartialData({
      departure_date: optionalDtToFirestore(this.departureDate),
      number_of_nights: this.numberOfNights,
    })}
  }
}

export class TCoworkingReservation extends TReservation {

  protected static KIND = TReservationRequestKind.COWORKING

  get kind() {
    return TCoworkingReservation.KIND
  }

  toDescription() {
    return `le ${this.arrivalDate.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)}`
  }

  toRangeDays(): DateTime[] {
    return [this.arrivalDate]
  }

  static supports(snapshot: admin.firestore.DocumentSnapshot) {
    const data = snapshot.data()
    return data && data.kind === TCoworkingReservation.KIND
  }

  static fromFirestore(snapshot: admin.firestore.DocumentSnapshot) {
    const data = TReservation.fromBaseFirestore(snapshot)
    return new TCoworkingReservation(
      data.paxId,
      data.arrival_date,
      data.id,
    )
  }

  toFirestore() {
    const ret = super.toFirestore()
    return {
      ...ret, ...makePartialData({
        // coworking has same arrival and departure dates, for filtering purpose
        departure_date: optionalDtToFirestore(this.arrivalDate),
      })
    }
  }
}

export const TReservationRequestConverter: admin.firestore.FirestoreDataConverter<TReservation> = {
  fromFirestore: (snapshot) => {

    if (TColivingReservation.supports(snapshot)) {
      return TColivingReservation.fromFirestore(snapshot)
    }
    else if(TCoworkingReservation.supports(snapshot)) {
      return TCoworkingReservation.fromFirestore(snapshot)
    }
    throw new Error("invalid data")
  },
  toFirestore: (entity: TReservation) => {
    return entity.toFirestore()
  },
}

export async function createReservation(reservation:TReservation) {

  const request_doc = await db
    .collection(`pax/${reservation.paxId}/requests`)
    .withConverter(TReservationRequestConverter)
    .add(reservation)

  const batch = db.batch()

  reservation.toRangeDays().forEach((r) => {
    batch.set(db.collection(`pax/${reservation.paxId}/days`).doc(r.toISODate()).withConverter(TDayConverter), {
      on: r,
      request: request_doc,
      state: TDayState.PENDING_REVIEW,
      kind: reservation.kind,
    })
  })

  await batch.commit()
}


export async function confirmReservation(reservation: TReservation) {
  if (!reservation.id) {
    throw Error(`reservation.id is not defined`)
  }
  const batch = db.batch()
  const request_ref = db.doc(`pax/${reservation.paxId}/requests/${reservation.id}`)
    .withConverter(TReservationRequestConverter)

  const request_data: Partial<TReservation> = {
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

export async function cancelReservation(reservation:TReservation) {
  if (!reservation.id) {
    throw Error(`reservation.id is not defined`)
  }
  const batch = db.batch()
  const request_ref = db.doc(`pax/${reservation.paxId}/requests/${reservation.id}`)
    .withConverter(TReservationRequestConverter)

  const request_data: Partial<TReservation> = {
    state: TReservationRequestState.CANCELED,
  }
  batch.set(request_ref, request_data, { merge: true })

  const daysQuerySnap = await db.collection(`pax/${reservation.paxId}/days`)
    .withConverter(TDayConverter)
    .where("request", "==", request_ref)
    .get()

  daysQuerySnap.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  await batch.commit()
}
