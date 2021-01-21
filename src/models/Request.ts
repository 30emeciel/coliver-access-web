import { DateTime } from "luxon";
import admin from "firebase"
import { $enum } from "ts-enum-util";

export type TRequestStatus = "PENDING_REVIEW" | "CONFIRMED"
export type TRequestKind = "COLIVING" | "COWORKING"

export interface TRequest {
  id?: string
  created?: DateTime
  status: TRequestStatus
  arrivalDate: DateTime
  departureDate: DateTime
  kind: TRequestKind
  numberOfNights? : number
}



export const RequestConverter:admin.firestore.FirestoreDataConverter<TRequest> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)


    return {
      created: DateTime.fromMillis((data.created as admin.firestore.Timestamp).toMillis()),
      status: data.status,
      arrivalDate: DateTime.fromMillis((data.arrivalDate as admin.firestore.Timestamp).toMillis()),
      departureDate: DateTime.fromMillis((data.departureDate as admin.firestore.Timestamp).toMillis()),
      kind: data.kind,
      numberOfNights: data.numberOfNights
    }
  },
  toFirestore: (entity:TRequest) => {
    return {
      created: admin.firestore.FieldValue,
      status: entity.status,
      arrivalDate: admin.firestore.Timestamp.fromDate(entity.arrivalDate.toJSDate()),
      departureDate: admin.firestore.Timestamp.fromDate(entity.departureDate.toJSDate()),
      kind: entity.kind,
      numberOfNights: entity.numberOfNights

    }
  }
}
