import admin from "firebase"
import { makePartialData } from "./utils"


export enum TPaxStates {
  Authenticated = "AUTHENTICATED",
  Registered = "REGISTERED",
  Confirmed = "CONFIRMED",
}


export interface TPax {
  id: string
  name: string
  email: string
  state: TPaxStates
  picture?: string
  isSupervisor: boolean
  preregistrationFormEntryUrl?: string
  allowDelayedContribution?: boolean
}

export const TPaxConverter: admin.firestore.FirestoreDataConverter<TPax> = {
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)

    return {
      id: snapshot.id,
      name: data.name,
      email: data.email,
      state: data.state ?? TPaxStates.Authenticated,
      picture: data.picture,
      isSupervisor: data.is_supervisor ?? false,
      allowDelayedContribution: data.allow_delayed_contribution ?? false,
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
      preregistration_form_entry_url: entity.preregistrationFormEntryUrl,
      allow_delayed_contribution: entity.allowDelayedContribution,
    })
  },
}

export function goToPaxAccountView(history: { push: (a: string) => void }, paxId: string) {
  history.push(`/supervisor/pax/${paxId}/account`)
}
