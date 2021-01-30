import admin from "firebase"
import { DateTime } from "luxon"


export type TReservationRequestState = "PENDING_REVIEW" | "CONFIRMED"
export type TReservationRequestKind = "COLIVING" | "COWORKING"

export interface TReservationRequest {
  id?: string
  created?: DateTime
  kind: TReservationRequestKind
  state: TReservationRequestState
  arrivalDate: DateTime
  departureDate?: DateTime
  numberOfNights?: number
}
function dtFromFirestore(firestore_timestamp:any) {
  return DateTime.fromMillis((firestore_timestamp as admin.firestore.Timestamp).toMillis())
}

function dtToFirestore(dt:DateTime) {
  return admin.firestore.Timestamp.fromDate(dt.toJSDate())
}

export const TReservationRequestConverter: admin.firestore.FirestoreDataConverter<TReservationRequest> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)

    return {
      created: dtFromFirestore(data.created),
      state: data.state || data.status,
      arrivalDate: dtFromFirestore(data.arrival_date),
      departureDate: data.departureDate ? dtFromFirestore(data.departure_date) : undefined,
      kind: data.kind,
      numberOfNights: data.number_of_nights,
    }
  },
  toFirestore: (entity: Partial<TReservationRequest>) => {
    return {
      created: admin.firestore.FieldValue.serverTimestamp(),
      kind: entity.kind,
      state: entity.state,
      arrival_date: entity.arrivalDate ? dtToFirestore(entity.arrivalDate) : null,
      departure_date: entity.departureDate
        ? dtToFirestore(entity.departureDate)
        : null,
      number_of_nights: entity.numberOfNights ? entity.numberOfNights : null,
    }
  },
}
