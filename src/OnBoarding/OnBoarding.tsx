import { SmileOutlined, SolutionOutlined } from "@ant-design/icons"
import { Card, Spin, Steps } from "antd"
import { useContext, useEffect, useRef, useState } from "react"
import PaxContext from "src/core/paxContext"
import { TPax, TPaxConverter, TPaxStates } from "src/models/Pax"
import { getEnvOrFail } from "src/core/getEnvOrFail"
import myloglevel from "src/core/myloglevel"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUserCheck } from "@fortawesome/free-solid-svg-icons"
import { faEnvelopeOpen } from "@fortawesome/free-regular-svg-icons"

const log = myloglevel.getLogger("OnBoarding")

const { Step } = Steps;

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cognito {
  function load(s: string, options: any, callbacks?: any): void
  function prefill(arg: any): void
}


declare function ExoJQuery(arg: any): any

const PREREGISTRATION_FORM_ID = getEnvOrFail("PREREGISTRATION_FORM_ID")

const CognitoFormSeamless = ({ entry, onSubmit }: { entry: any; onSubmit: (e: any, data: any) => void }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const current = ref.current
    if (!current) {
      return
    }
    log.debug("Cognito.load")

    Cognito.load(
      "forms",
      { id: PREREGISTRATION_FORM_ID, entry: entry },
      {
        success: () => {
          //      ExoJQuery(function() {
          //if (!ref.current) return () => {};
          //})
        },
      }
    )

    ExoJQuery(document).on("afterSubmit.cognito", onSubmit)

    return () => {
      log.debug("Cognito unload")
      while (current.firstChild) {
        current.removeChild(current.firstChild)
      }
      ExoJQuery(document).on("afterSubmit.cognito", null)
    }
  }, [entry, onSubmit])

  return <div ref={ref} className="cognito" />
}

export default function OnBoarding() {
  const uc = useContext(PaxContext)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmitFct = async (e: any, data: any) => {
    setIsSubmitting(true)
    log.info("onSubmit")
    const weirdId = data.entry.Id as string
    const [formId, entryId] = weirdId.split("-")
    const preregistrationFormEntryUrl = `https://www.cognitoforms.com/_30%C3%A8meCiel/${formId}/entries/${entryId}`
    const userDocRef = uc.ref!
    const data_update:Partial<TPax> = {
      state: TPaxStates.Registered,
      preregistrationFormEntryUrl: preregistrationFormEntryUrl
    }
    await userDocRef.withConverter(TPaxConverter).set(data_update, {merge: true})
    setIsSubmitting(false)
  }

  const cognitoFormEntry = {
    Uid: uc.doc?.sub,
    MyNameMonNom: uc.doc?.name,
    CourrielEmail: uc.doc?.email,
  }

  return (
    <>
          <Card>
            <Steps current={uc.doc!.state === TPaxStates.Registered ? 1 : 0} responsive={true}>
              <Step title="Étape 1 : Préinscription" description="Aide-moi à mieux te connaître" icon={<SolutionOutlined />}/>
              <Step title="Étape 2 : Confirmation" description="Attends la confirmation de ta préinscription" icon={<FontAwesomeIcon icon={faUserCheck} />}/>
              <Step title="C'est parti !" icon={<SmileOutlined />} />
            </Steps>
            </Card>
        <br />
            {uc.doc!.state == TPaxStates.Authenticated && (
              <>
                <h3>Inscription</h3>
                <p>
                  Avant de venir, le rôle <strong>Participante</strong> a besoin d'en savoir un peu plus sur toi.
                  Est-ce que tu peux remplir ce formulaire ?
                </p>
                {isSubmitting ? <Spin /> : <CognitoFormSeamless entry={cognitoFormEntry} onSubmit={onSubmitFct} />}
              </>
            )}
            {uc.doc!.state === TPaxStates.Registered && (
              <>
                <h3>Confirmation</h3>
                <p>
                  J'ai envoyé ta préinscription au rôle <strong>Participante</strong> qui va revenir vers toi. Je t'invite à vérifier tes courriels <FontAwesomeIcon icon={faEnvelopeOpen} />
                </p>
              </>
            )}
    </>
  )
}


