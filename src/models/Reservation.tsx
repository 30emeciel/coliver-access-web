import admin from "firebase"
import firebase from "firebase"
import { DateTime, Duration, Interval } from "luxon"
import { dtFromFirestore, dtToFirestore, makePartialData, optionalDtFromFirestore } from "./utils"
import db from "src/core/db"
import { TDay, TDayConverter, TDayState } from "./Day"
import { Memoize } from "typescript-memoize"
import { zip } from "../core/zip"
import React, { useState } from "react"
import WorkInProgress from "../core/WorkInProgress"
import { Button, Popconfirm, Space } from "antd"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCheckDouble,
  faEdit,
  faExclamationCircle,
  faHandHolding,
  faHandHoldingUsd, faStop, faUndo,
} from "@fortawesome/free-solid-svg-icons"
import { $enum } from "ts-enum-util"

type QueryDocumentSnapshot<T> = firebase.firestore.QueryDocumentSnapshot<T>

export enum TReservationState {
  PENDING_REVIEW = "PENDING_REVIEW",
  CONFIRMED = "CONFIRMED",
  CANCELED = "CANCELED"
}

export enum TReservationKind {
  COLIVING = "COLIVING",
  COWORKING = "COWORKING"
}

export enum TReservationContributionState {
  START = "START",
  EMAILED = "EMAILED",
  PENDING = "PENDING",
  PAID = "PAID",
}

export enum TMealPlans {
  ONE = "ONE",
  TWO = "TWO",
  THREE = "THREE",
  NONE= "NONE",
}

export interface TReservationDto {
  created?: admin.firestore.Timestamp
  kind: TReservationKind
  state: TReservationState
  contribution?: number | null,
  suggested_contribution?: number,
  contribution_state?: TReservationContributionState,
  arrival_date: admin.firestore.Timestamp
  arrival_time?: string,
  departure_date?: admin.firestore.Timestamp,
  note?: string,
  meal_plan? : TMealPlans,
  conditional_arrival?: string,
  blocked_pax?: string,
  volunteering? : boolean,
}

export abstract class TReservation {
  protected constructor(
    public paxId: string,
    public arrivalDate: DateTime,
    public contribution: number | null,
    public suggestedContribution: number | null,
    public contributionState : TReservationContributionState,
    public mealPlan: TMealPlans,
    public volunteering: boolean,
    public id?: string,
    public created?: DateTime,
    public state = TReservationState.PENDING_REVIEW,
    public arrivalTime?: string,
    public note?: string,
    public conditionalArrival?: string,
    public blockedPax?: string,
) {}


  abstract get kind() : TReservationKind

  get isEditable() {
    return true
  }
  get isCancelable() {
    return this.isEditable && this.state != TReservationState.CANCELED
  }

  abstract toDescription():string

  abstract toRangeDays(): DateTime[]

  static fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot<TReservationDto>):Pick<TReservation, "id" | "paxId" | "created" | "arrivalDate" | "arrivalTime" | "state" | "contribution" | "suggestedContribution" | "contributionState" | "mealPlan" | "note" | "conditionalArrival" | "blockedPax" | "volunteering"> {
    const dto = snapshot.data()
    const paxId = snapshot.ref.parent?.parent?.id
    if (!paxId) {
      throw Error("request has no valid pax")
    }
    return {
      paxId: paxId,
      arrivalDate: dtFromFirestore(dto.arrival_date),
      id: snapshot.id,
      created: optionalDtFromFirestore(dto.created),
      state: dto.state,
      contribution: dto.contribution ?? null,
      suggestedContribution: dto.suggested_contribution ?? null,
      contributionState: dto.contribution_state ?? TReservationContributionState.START,
      mealPlan: dto.meal_plan ?? TMealPlans.THREE,
      arrivalTime: dto.arrival_time,
      note: dto.note,
      conditionalArrival: dto.conditional_arrival,
      blockedPax: dto.blocked_pax,
      volunteering: dto.volunteering ?? false,
    }
  }

  toFirestore(): Partial<TReservationDto> {
    return makePartialData({
      kind: this.kind,
      arrival_date: dtToFirestore(this.arrivalDate),
      created: this.created ? dtToFirestore(this.created) : admin.firestore.FieldValue.serverTimestamp(),
      state: this.state ,
      contribution: this.contribution,
      suggested_contribution: this.suggestedContribution ?? undefined,
      contribution_state: this.contributionState,
      meal_plan: this.mealPlan,
      arrival_time: this.arrivalTime,
      note: this.note,
      conditional_arrival: this.conditionalArrival,
      blocked_pax: this.blockedPax,
      volunteering: this.volunteering,
    })
  }

}

export class TColivingReservation extends TReservation {

  constructor(
    paxId: string,
    arrivalDate: DateTime,
    public departureDate: DateTime,
    contribution: number | null,
    suggestedContribution: number | null,
    contributionState: TReservationContributionState,
    mealPlan: TMealPlans,
    volunteering: boolean,
    id?: string,
    created?: DateTime,
    state?: TReservationState,
    arrivalTime?: string,
    note?: string,
    conditionalArrival?: string,
    blockedPax?: string,
  ) {
    super(paxId, arrivalDate, contribution, suggestedContribution, contributionState, mealPlan, volunteering, id, created, state, arrivalTime, note, conditionalArrival, blockedPax)
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

  static fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot<TReservationDto>):TColivingReservation {
    const { ...rest } = TReservation.fromFirestore(snapshot)
    const dto = snapshot.data()
    if (!dto.departure_date) {
      throw Error("invalid data")
    }
    const data = {
      departureDate: dtFromFirestore(dto.departure_date)
    }
    return new TColivingReservation(
      rest.paxId,
      rest.arrivalDate,
      data.departureDate,
      rest.contribution,
      rest.suggestedContribution,
      rest.contributionState,
      rest.mealPlan,
      rest.volunteering,
      rest.id,
      rest.created,
      rest.state,
      rest.arrivalTime,
      rest.note,
      rest.conditionalArrival,
      rest.blockedPax,
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
    contribution: number | null,
    suggestedContribution: number | null,
    contributionState: TReservationContributionState,
    mealPlan: TMealPlans,
    volunteering: boolean,
    id?: string,
    created?: DateTime,
    state?: TReservationState,
    arrivalTime?: string,
    note?: string,
    conditionalArrival?: string,
    blockedPax?: string,

  ) {
    super(paxId, arrivalDate, contribution, suggestedContribution, contributionState, mealPlan, volunteering, id, created, state, arrivalTime, note, conditionalArrival, blockedPax)
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

  static fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot<TReservationDto>):TCoworkingReservation {
    const { ...rest } = TReservation.fromFirestore(snapshot)
    return new TCoworkingReservation(
      rest.paxId,
      rest.arrivalDate,
      rest.contribution,
      rest.suggestedContribution,
      rest.contributionState,
      rest.mealPlan,
      rest.volunteering,
      rest.id,
      rest.created,
      rest.state,
      rest.arrivalTime,
      rest.note,
      rest.conditionalArrival,
      rest.blockedPax,
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

export const TReservationRequestConverter: admin.firestore.FirestoreDataConverter<TReservation> = {

  fromFirestore: (snapshot:QueryDocumentSnapshot<TReservationDto>) => {
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

export async function updatePayment(reservation: TReservation, paymentState: TReservationContributionState) {
  if (!reservation.id) {
    throw Error(`reservation.id is not defined`)
  }

  const request_ref = db.doc(`pax/${reservation.paxId}/requests/${reservation.id}`)
    .withConverter(TReservationRequestConverter)

  reservation.contributionState = paymentState
  await request_ref.set(
    reservation
    , {merge: true}
  )

}



export const ActionButtons = ({ reservation, isSupervisor }: { reservation: TReservation, isSupervisor: boolean }) => {
  const [isConfirmationSubmitting, setIsConfirmationSubmitting] = useState(false)
  const [isPaymentConfirmationSubmitting, setIsPaymentConfirmationSubmitting] = useState(false)

  const myConfirmReservation = async () => {
    setIsConfirmationSubmitting(true)
    await confirmReservation(reservation)
    // When all done, reset the UI
    setIsConfirmationSubmitting(false)
  }

  const [isCancelingSubmitting, setIsCancelingSubmitting] = useState(false)

  const myCancelReservation = async () => {
    setIsCancelingSubmitting(true)
    await cancelReservation(reservation)
    // When all done, reset the UI
    setIsCancelingSubmitting(false)
  }

  const myUpdatePayment = async () => {
    setIsPaymentConfirmationSubmitting(true)
    await updatePayment(reservation, reservation.contributionState == TReservationContributionState.PAID ? TReservationContributionState.PENDING : TReservationContributionState.PAID )
    // When all done, reset the UI
    setIsPaymentConfirmationSubmitting(false)
  }



  const actions = [
    <WorkInProgress><Button
      disabled
      key="edit"
      size="small"
      icon={<FontAwesomeIcon icon={faEdit} />}>Modifier</Button></WorkInProgress>,
    <Popconfirm
      key="cancel"
      arrowPointAtCenter
      onConfirm={myCancelReservation}
      title="Est-ce que tu veux annuler cette réservation ?"
      okText="Oui"
      cancelText="Non">
      <Button
        danger
        disabled={reservation.state == TReservationState.CANCELED}
        size="small"
        loading={isCancelingSubmitting}
        icon={<FontAwesomeIcon icon={faExclamationCircle} />}>Annuler</Button>
    </Popconfirm>,
  ]
  if (isSupervisor) {

      const confirmPaymentBtn = <Button
        size="small"
        disabled={[TReservationState.CANCELED, ].includes(reservation.state)}
        loading={isPaymentConfirmationSubmitting}
        onClick={myUpdatePayment}
        type={reservation.contributionState == TReservationContributionState.PAID ? "default" : "primary"}
        icon={reservation.contributionState == TReservationContributionState.PAID  ? <FontAwesomeIcon icon={faUndo} /> : <FontAwesomeIcon icon={faHandHoldingUsd} />}>{reservation.contributionState == TReservationContributionState.PAID ? "Non payé" : "Marqué payé"}</Button>

      actions.push(confirmPaymentBtn)

      const confirmBtn = <Popconfirm
        key="confirm"
        placement="topLeft"
        onConfirm={myConfirmReservation}
        title="Est-ce que tu veux confirmer cette réservation ?"
        okText="Oui"
        cancelText="Non"
      ><Button
        size="small"
        disabled={[TReservationState.CANCELED, TReservationState.CONFIRMED].includes(reservation.state)}
        loading={isConfirmationSubmitting}
        type="primary"
        icon={<FontAwesomeIcon icon={faCheckDouble} />}>Confirmer</Button>
      </Popconfirm>
      actions.push(confirmBtn)

  }
  return <Space>{actions}</Space>

}
export const getMealPlanPrice = (mealPlan: TMealPlans) => {
  return $enum.mapValue(mealPlan).with({
    [TMealPlans.NONE]: 0,
    [TMealPlans.ONE]: 3,
    [TMealPlans.TWO]: 5,
    [TMealPlans.THREE]: 7,
  })
}
export const getMealPlanTitle = (mealPlan: TMealPlans) => {
  return $enum.mapValue(mealPlan).with({
    [TMealPlans.NONE]: "Aucun",
    [TMealPlans.ONE]: "1",
    [TMealPlans.TWO]: "2",
    [TMealPlans.THREE]: "3",
  })
}

export const getContributionStateTitle = (contributionState: TReservationContributionState) => {
  return $enum.mapValue(contributionState).with({
    [TReservationContributionState.START]: "Différé",
    [TReservationContributionState.PENDING]: "À vérifier",
    [TReservationContributionState.EMAILED]: "Email envoyé",
    [TReservationContributionState.PAID]: "Payé",
  })
}
