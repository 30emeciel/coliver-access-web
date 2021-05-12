import admin from "firebase"
import { makePartialData } from "./utils"


export enum TPaxStates {
  Authenticated = "AUTHENTICATED",
  Registered = "REGISTERED",
  Confirmed = "CONFIRMED",
}


export interface TPax {
  sub: string;
  name: string;
  email: string;
  state: TPaxStates;
  picture?: string;
  isSupervisor: boolean;
  preregistrationFormEntryUrl?: string;
}

export const TPaxConverter: admin.firestore.FirestoreDataConverter<TPax> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)

    return {
      sub: data.sub,
      name: data.name,
      email: data.email,
      state: data.state ?? TPaxStates.Authenticated,
      picture: data.picture,
      isSupervisor: data.is_supervisor ?? false,
      preregistrationFormEntryUrl: data.preregistration_form_entry_url
    }
  },
  toFirestore: (entity: Partial<TPax>) => {
    return makePartialData({
      // prevent to change pax id
      // sub: entity.sub,
      name: entity.name,
      email: entity.email,
      state: entity.state,
      picture: entity.picture,
      is_supervisor: entity.isSupervisor,
      preregistration_form_entry_url: entity.preregistrationFormEntryUrl
    })
  },
}

export function goToPaxAccountView(history: { push: (a: string) => void }, paxId: string) {
  history.push(`/supervisor/pax/${paxId}/account`)
}
