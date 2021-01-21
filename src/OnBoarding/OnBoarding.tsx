import { CheckSquareOutlined, LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons'
import { Card, Steps } from "antd"
import { useContext, useEffect, useRef } from "react"
import PaxContext from "src/core/paxContext"
import { PaxStates } from "src/core/usePax"
import { getEnvOrFail } from 'src/core/getEnvOrFail'
import myloglevel from "src/core/myloglevel"

const log = myloglevel.getLogger("OnBoarding")

const { Step } = Steps;
declare namespace Cognito {
  function load(s: string, options: any, callbacks?: any): void
  function prefill(arg: any): void
}


declare function ExoJQuery(arg: any): any

const PREREGISTRATION_FORM_ID = getEnvOrFail("PREREGISTRATION_FORM_ID")

const CognitoFormSeamless = ({ entry, onSubmit }: { entry: any; onSubmit: () => void }) => {
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

  return <div ref={ref} className="cognito"></div>
}

const OnBoarding = () => {
  const uc = useContext(PaxContext)

  const onSubmitFct = () => {
    log.info("onSubmit")
    const userDocRef = uc.ref!
    userDocRef.update({ state: "REGISTERED" })
  }

  const cognitoFormEntry = {
    Uid: uc.doc!.sub,
  }

  return (
    <>
          <Card>
            <Steps current={uc.doc!.state === PaxStates.Registered ? 2 : 1}>
              <Step title="Identification" description="Tu créés un compte PaxID" icon={<UserOutlined />} />
              <Step title="Préinscription" description="Aide-moi à mieux te connaître" icon={<SolutionOutlined />}/>
              <Step title="Confirmation" description="Attends la confirmation de ton inscription" icon={uc.doc!.state === PaxStates.Registered ? <LoadingOutlined /> : <CheckSquareOutlined />}/>
              <Step title="C'est parti !" icon={<SmileOutlined />} />
            </Steps>
            </Card>
        <br />
            {!uc.doc!.state && (
              <>
                <h3>Inscription</h3>
                <p>
                  Avant de venir, le rôle <strong>Participante</strong> a besoin d'en savoir un peu plus sur toi.
                  Est-ce que tu peux remplir ce formulaire ?
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
    </>
  )
}

export default OnBoarding
