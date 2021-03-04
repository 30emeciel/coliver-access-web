import firebase from "firebase"
import admin from "firebase"
import { useCollection } from "react-firebase-hooks/firestore"
import { useEffect, useState } from "react"

export function useTypedCollectionData<C, T = firebase.firestore.DocumentData>(query: firebase.firestore.Query<T>, tx: admin.firestore.FirestoreDataConverter<C>): [C[] | undefined, boolean, Error | undefined] {
  const [snapshot, loading, error]: [firebase.firestore.QuerySnapshot<T> | undefined, boolean, Error | undefined] = useCollection(
    query,
  )
  const [typedList, setTypedList] = useState<C[] | undefined>()
  useEffect(() => {
    if (!snapshot)
      return
    setTypedList(snapshot.docs.map((i) => tx.fromFirestore(i, {})))
  }, [snapshot])
  return [typedList, loading, error]
}
