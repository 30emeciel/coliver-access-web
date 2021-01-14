import { CheckSquareOutlined, LoadingOutlined, SmileOutlined, SolutionOutlined, UserOutlined } from '@ant-design/icons'
import { Steps } from "antd"
import { useContext, useEffect, useRef } from "react"
import PaxContext from "src/core/paxContext"
import { PaxStates } from "src/core/usePax"
import { getEnvOrFail } from '../core/getEnvOrFail'

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

  return (
    <>
            <Steps current={uc.doc!.state === PaxStates.Registered ? 2 : 1}>
              <Step title="Identification" description="Tu créés un compte PaxID" icon={<UserOutlined />} />
              <Step title="Inscription" description="Aide-moi à mieux te connaître" icon={<SolutionOutlined />}/>
              <Step title="Confirmation" description="Je confirme ton inscription" icon={uc.doc!.state === PaxStates.Registered ? <LoadingOutlined /> : <CheckSquareOutlined />}/>
              <Step title="C'est parti !" icon={<SmileOutlined />} />
            </Steps>
        <br />
            {!uc.doc!.state && (
              <>
                <h3>Inscription</h3>
                <p>
                  Avant de venir, j'ai besoin d'en savoir un peu plus sur toi.
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
    </>
  )
}

export default OnBoarding
