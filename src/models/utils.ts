import { DateTime } from "luxon"
import admin from "firebase"

export function dtFromFirestore(firestore_timestamp: admin.firestore.Timestamp) {
  if (!firestore_timestamp)
    throw Error("firestore_timestamp not defined")

  return DateTime.fromMillis((firestore_timestamp).toMillis())
}

export function optionalDtFromFirestore(firestore_timestamp: admin.firestore.Timestamp) {
  return firestore_timestamp ? dtFromFirestore(firestore_timestamp) : undefined
}

export function dtToFirestore(dt: DateTime) {
  if (!dt)
    throw Error("dt not defined")

  return admin.firestore.Timestamp.fromDate(dt.toJSDate())
}

export function optionalDtToFirestore(dt?: DateTime) {
  return dt ? dtToFirestore(dt) : undefined
}

export function makePartialData(o:object) {
  return Object.fromEntries(Object.entries(o).filter(([key, value]:[string, any]) => value !== undefined))
}
