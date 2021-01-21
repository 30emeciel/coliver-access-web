import admin from "firebase"
import { DateTime } from "luxon"
import { isJSDocNullableType } from "typescript"

export type TRequestStatus = "PENDING_REVIEW" | "CONFIRMED"
export type TRequestKind = "COLIVING" | "COWORKING"

export interface TRequest {
  id?: string
  created?: DateTime
  kind: TRequestKind
  status: TRequestStatus
  arrivalDate: DateTime
  departureDate?: DateTime
  numberOfNights?: number
}

export const TRequestConverter: admin.firestore.FirestoreDataConverter<TRequest> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)

    return {
      created: DateTime.fromMillis((data.created as admin.firestore.Timestamp).toMillis()),
      status: data.status,
      arrivalDate: DateTime.fromMillis((data.arrivalDate as admin.firestore.Timestamp).toMillis()),
      departureDate: data.departureDate ? DateTime.fromMillis((data.departureDate as admin.firestore.Timestamp).toMillis()) : undefined,
      kind: data.kind,
      numberOfNights: data.numberOfNights,
    }
  },
  toFirestore: (entity: TRequest) => {
    return {
      created: admin.firestore.FieldValue.serverTimestamp(),
      kind: entity.kind,
      status: entity.status,
      arrivalDate: admin.firestore.Timestamp.fromDate(entity.arrivalDate.toJSDate()),
      departureDate: entity.departureDate
        ? admin.firestore.Timestamp.fromDate(entity.departureDate.toJSDate())
        : null,
      numberOfNights: entity.numberOfNights ? entity.numberOfNights : null,
    }
  },
}
