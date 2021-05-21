import axios from "axios"
import myloglevel from "src/core/myloglevel"
import { getEnvOrFail } from "./getEnvOrFail"

declare function FreshworksWidget(s: string, s2?: any, s3?: any): void

const log = myloglevel.getLogger("freshdesk")


const FUNCTIONS_HOST = getEnvOrFail("FUNCTIONS_HOST")

export function login(auth0Token: string) {

  async function authenticateCallback() {
    const exchange_token_response = await axios
      .post(`${FUNCTIONS_HOST}/freshdesk-token-exchange`, {
        access_token: auth0Token,
      })

    FreshworksWidget('authenticate', {
      token: exchange_token_response.data.freshdesk_token,
      callback: authenticateCallback
    });
  }

  authenticateCallback().then(() => log.debug("freshdesk authenticated"))
}

export function logout() {
  FreshworksWidget('logout');
}

export function openTicketForm() {
  FreshworksWidget('open', 'ticketForm');
}

export function open() {
  FreshworksWidget('open');
}

