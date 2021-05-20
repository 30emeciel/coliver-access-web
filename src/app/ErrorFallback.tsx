import { Button, Image, Result } from "antd"
import casse from "./cassé.jpg"
import { openTicketForm as freshdeskOpen } from "src/core/freshdesk"
import { useEffect } from "react"
import axios from "axios"
import { getEnvOrFail } from "src/core/getEnvOrFail"

const VERSION = getEnvOrFail("VERSION")

export function ErrorFallback({ error }: { error: Error; }) {
  const errorReportingApiKey = localStorage.getItem("ERROR_REPORTING_API_KEY")
  const title = "Bravo ! Tu viens de trouver un bug dans notre application."
  const extra = <Button onClick={freshdeskOpen}>Envoyer une demande de support</Button>

  useEffect(() => {
    if (!errorReportingApiKey && process.env.NODE_ENV == "production")
      return
    const data = {
      "message": error.stack,
      "serviceContext": {
        "service": "coliver-access-web",
        "version": VERSION
      }
    }
    axios.post(`https://clouderrorreporting.googleapis.com/v1beta1/projects/trentiemeciel/events:report?key=${errorReportingApiKey}`, data)
      .then()

  })
  return (
    <Result status="warning" title={title} subTitle={error.message} icon={<Image preview={false} alt="cassé" src={casse} />} extra={extra} />
  );
}
