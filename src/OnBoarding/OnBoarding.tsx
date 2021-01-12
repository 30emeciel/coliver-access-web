import "rc-steps/assets/index.css"
import Steps, { Step } from "rc-steps"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faCoffee } from "@fortawesome/free-solid-svg-icons"
import useUser, { Pax, PaxStates } from "src/core/usePax"
import { useContext, useEffect, useRef } from "react"
import PaxContext from "src/core/paxContext"
import { Col, Row } from "antd"

declare namespace Cognito {
  function load(s: string, options: any, callbacks?: any): void
  function prefill(arg: any): void
}

declare function ExoJQuery(arg: any): any

const CognitoFormSeamless = ({ entry, onSubmit }: { entry: any; onSubmit: () => void }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const current = ref.current
    if (!current) {
      return
    }

    Cognito.load(
      "forms",
      { id: 9, entry: entry },
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
      while (current.firstChild) {
        current.removeChild(current.firstChild)
      }
      ExoJQuery(document).on("afterSubmit.cognito", null)
    }
  }, [entry, onSubmit])

  return <div ref={ref} className="cognito"></div>
}

const OnBoarding = () => {
  const uc = useContext(PaxContext)

  const onSubmitFct = () => {
    console.log("onSubmit")
    const userDocRef = uc.ref!
    userDocRef.update({ state: "REGISTERED" })
  }

  const cognitoFormEntry = {
    Uid: uc.doc!.sub,
  }

  const cognitoFormUrl = `https://www.cognitoforms.com/_30%C3%A8meCiel/CoworkingColiving30%C3%A8meCielRegistration?entry=${encodeURIComponent(
    JSON.stringify(cognitoFormEntry)
  )}`

  const finishIcon = <FontAwesomeIcon icon={faCheck} />
  const icons = {
    finish: finishIcon,
    error: null,
  }
  return (
    <>
        <Row>
          <Col>
            <Steps current={uc.doc!.state === PaxStates.Registered ? 2 : 1} icons={icons}>
              <Step title="Identification" description="Tu créés un compte PaxID" />
              <Step title="Inscription" description="Aide-moi à mieux te connaître" />
              <Step title="Confirmation" description="Je confirme ton inscription" />
            </Steps>
          </Col>
        </Row>
        <br />
        <Row>
          <Col>
            {!uc.doc!.state && (
              <>
                <h3>Inscription</h3>
                <p>
                  Avant de venir, <FontAwesomeIcon icon={faCoffee} /> j'ai besoin d'en savoir un peu plus sur toi.
                  Est-ce que tu peux remplir ce formulaire ? Le rôle <strong>Participante</strong> va revenir vers toi
                  pour la suite
                </p>
                <CognitoFormSeamless entry={cognitoFormEntry} onSubmit={onSubmitFct} />
              </>
            )}
            {uc.doc!.state === PaxStates.Registered && (
              <>
                <h3>Confirmation</h3>
                <p>
                  Attends que le rôle <strong>Participante</strong> confirme ton inscription.
                </p>
              </>
            )}
          </Col>
        </Row>
    </>
  )
}

export default OnBoarding
