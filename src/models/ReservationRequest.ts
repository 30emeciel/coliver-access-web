import firebase from "firebase"
import { DateTime, Duration, Interval } from "luxon"
import { dtFromFirestore, dtToFirestore, makePartialData, optionalDtFromFirestore } from "./utils"
import db from "src/core/db"
import { TDay, TDayConverter, TDayState } from "./Day"
import { Memoize } from "typescript-memoize"
import { zip } from "../core/zip"
import { z } from "zod"
type Timestamp = firebase.firestore.Timestamp
const FieldValue = firebase.firestore.FieldValue
type QueryDocumentSnapshot = firebase.firestore.QueryDocumentSnapshot

const timestampSchema = z.custom<Timestamp>()

export enum TReservationKind {
  COLIVING = "COLIVING",
  COWORKING = "COWORKING"
}

const reservationKindSchema = z.nativeEnum(TReservationKind)

export enum TReservationState {
  PENDING_REVIEW = "PENDING_REVIEW",
  CONFIRMED = "CONFIRMED",
  CANCELED = "CANCELED"
}

const reservationStateSchema = z.nativeEnum(TReservationState)

export enum TReservationContributionState {
  START = "START",
  EMAILED = "EMAILED",
}

const reservationContributionStateSchema = z.nativeEnum(TReservationContributionState)


const baseReservationDtoSchema = z.object({
  created: timestampSchema,
  kind: reservationKindSchema,
  state: reservationStateSchema,
  contribution_state: reservationContributionStateSchema,
  arrival_date: timestampSchema,
})

const colivingReservationDtoSchema = baseReservationDtoSchema.extend({
  kind: z.literal(TReservationKind.COLIVING),
  departure_date: timestampSchema,
  number_of_nights: z.number(),
})
  .transform(input => {
    return {
      created: dtFromFirestore(input.created),
      kind: input.kind,
      state: input.state,
      contributionState: input.contribution_state,
      departureDate: dtFromFirestore(input.departure_date),
      arrivalDate: dtFromFirestore(input.arrival_date),
      numberOfNights: input.number_of_nights,
    }
  })

export type TColivingReservationDto = z.infer<typeof colivingReservationDtoSchema>

const coworkingReservationDtoSchema = baseReservationDtoSchema.extend({
})

export type TCoworkingReservationDto = z.infer<typeof coworkingReservationDtoSchema>

export abstract class TReservation {
  protected constructor(
    public paxId: string,
    public arrivalDate: DateTime,
    public state: TReservationState,
    public contributionState: TReservationContributionState,
    public id?: string,
    public created?: DateTime,
) {}


  abstract get kind() : TReservationKind

  get isEditable() {
    return true
  }
  get isCancelable() {
    return this.isEditable && this.state != reservationStateSchema.enum.CANCELED
  }

  abstract toDescription():string

  abstract toRangeDays(): DateTime[]

  static getPaxIdFromReservation(snapshot: QueryDocumentSnapshot) {
    const paxId = snapshot.ref.parent?.parent?.id
    if (!paxId) {
      throw Error("request has no valid pax")
    }
    return {id: snapshot.id, paxId: paxId}
  }

  toFirestore(): Partial<TColivingReservationDto> {
    return makePartialData({
      created: this.created ? dtToFirestore(this.created) : FieldValue.serverTimestamp(),
      kind: this.kind,
      state: this.state ,
      arrival_date: dtToFirestore(this.arrivalDate),
      contribution_state: this.contributionState,
    })
  }

}

export class TColivingReservation extends TReservation {

  constructor(
    paxId: string,
    arrivalDate: DateTime,
    public departureDate: DateTime,
    state: TReservationState,
    contributionState: TReservationContributionState,
    id?: string,
    created?: DateTime,
  ) {
    super(paxId, arrivalDate, state, contributionState, id, created)
  }


  protected static KIND = TReservationKind.COLIVING

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

  static fromFirestore(snapshot: QueryDocumentSnapshot):TColivingReservation {
    const {id, paxId} = TReservation.getPaxIdFromReservation(snapshot)
    const dto = colivingReservationDtoSchema.parse(snapshot.data())

    return new TColivingReservation(
      paxId,
      dto.arrivalDate,
      dto.departureDate,
      dto.state,
      dto.contributionState,
      id,
      dto.created,
    )
  }

  toFirestore() {
    const ret = super.toFirestore()
    return {...ret, ...makePartialData({
      departure_date: dtToFirestore(this.departureDate),
      number_of_nights: this.numberOfNights,
    })} as TReservationDto
  }
}

export class TCoworkingReservation extends TReservation {

  constructor(
    paxId: string,
    arrivalDate: DateTime,
    state: TReservationState,
    contributionState: TReservationContributionState,
    id?: string,
    created?: DateTime,
  ) {
    super(paxId, arrivalDate, state, contributionState, id, created)
  }

  protected static KIND = TReservationKind.COWORKING

  get kind() {
    return TCoworkingReservation.KIND
  }

  toDescription() {
    return `le ${this.arrivalDate.setLocale("fr-fr").toLocaleString(DateTime.DATE_MED)}`
  }

  toRangeDays(): DateTime[] {
    return [this.arrivalDate]
  }

  static fromFirestore(snapshot: QueryDocumentSnapshot):TCoworkingReservation {
    const { ...rest } = TReservation.fromFirestore(snapshot)
    return new TCoworkingReservation(
      rest.paxId,
      rest.arrivalDate,
      rest.state,
      rest.contributionState,
      rest.id,
      rest.created,
    )
  }

  toFirestore() {
    const ret = super.toFirestore()
    return {
      ...ret, ...makePartialData({
        // coworking has same arrival and departure dates, for filtering purpose
        departure_date: dtToFirestore(this.arrivalDate),
      })
    } as TReservationDto
  }
}

const kind2class : Record<TReservationKind, typeof TColivingReservation | typeof TCoworkingReservation> = {
  COLIVING: TColivingReservation,
  COWORKING: TCoworkingReservation,
}

export const TReservationRequestConverter: firebase.firestore.FirestoreDataConverter<TReservation> = {

  fromFirestore: (snapshot:QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const clazz = kind2class[data.kind]
    return clazz.fromFirestore(snapshot)

  },
  toFirestore: (entity: TReservation) : Partial<TReservationDto> => {
    return entity.toFirestore()
  }
}

export async function createReservation(reservation:TReservation) {
  const rangeDays = reservation.toRangeDays()
  const rangeDaysDocRef = rangeDays.map((d) =>
    db.doc(`pax/${reservation.paxId}/days/${d.toISODate()}`)
      .withConverter(TDayConverter)
  )

  await db.runTransaction(async (transaction) => {
    const rangeDaysDocsPromise = rangeDaysDocRef.map((docRef) => transaction.get(docRef))
    const rangeDaysDocs = await Promise.all(rangeDaysDocsPromise)
    if (rangeDaysDocs.some((d) => d.exists)) {
      throw new Error("Cannot reserve because one of the day is already reserved.")
    }
    const reservationDocRef = db
      .collection(`pax/${reservation.paxId}/requests`)
      .doc()
      .withConverter(TReservationRequestConverter)
    transaction.set(reservationDocRef, reservation)

    zip(rangeDays, rangeDaysDocRef).forEach(([r, dayDocRef],) => {
        transaction.set(dayDocRef, {
          on: r,
          request: reservationDocRef,
          state: TDayState.PENDING_REVIEW,
          kind: reservation.kind,
        })
      })
  })

}


export async function confirmReservation(reservation: TReservation) {
  if (!reservation.id) {
    throw Error(`reservation.id is not defined`)
  }
  const batch = db.batch()
  const request_ref = db.doc(`pax/${reservation.paxId}/requests/${reservation.id}`)
    .withConverter(TReservationRequestConverter)
  reservation.state = TReservationState.CONFIRMED

  batch.set(request_ref, reservation, { merge: true })

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

  reservation.state = TReservationState.CANCELED

  batch.set(request_ref, reservation, { merge: true })

  const daysQuerySnap = await db.collection(`pax/${reservation.paxId}/days`)
    .withConverter(TDayConverter)
    .where("request", "==", request_ref)
    .get()

  daysQuerySnap.forEach((docSnap) => {
    batch.delete(docSnap.ref)
  })

  await batch.commit()
}
