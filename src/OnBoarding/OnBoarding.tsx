import "rc-steps/assets/index.css";
import Steps, { Step } from "rc-steps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCoffee } from "@fortawesome/free-solid-svg-icons";
import { Col, Container, Row } from "react-bootstrap";
import useUser, { User, UserStates } from "src/core/useUser";
import { useEffect, useRef } from "react";

declare namespace Cognito {
  function load(s: string, options: any, callbacks?: any): void;
  function prefill(arg: any): void
}


const CognitoFormSeamless = ({entry, onSubmit}:{entry: any, onSubmit: () => void}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const current = ref.current;
    if (!current) {
      return;
    }

    Cognito.load("forms", { id: 9, entry: entry }, {success: () => {
      document.addEventListener("afterSubmit.cognito", onSubmit)
    }});    

    return () => {
      while (current.firstChild) {
        current.removeChild(current.firstChild);
      }
      document.removeEventListener("afterSubmit.cognito", onSubmit)
    };
  }, [entry, onSubmit]);

  return <div ref={ref} className="cognito"></div>;
};

const CognitoFormIframe = ({ entry }: { entry: any }) => {

  useEffect(() => {
    Cognito.prefill(entry);
  })

  return (
    <iframe
      title="Formulaire d'inscription"
      src="https://www.cognitoforms.com/f/4kbxQ9QOqUC84JAu8PU9xA?id=9"
      frameBorder="0"
      scrolling="yes"
      seamless={true}
      height="3363"
      width="100%"
    />
  );
};
const OnBoarding = ({ user }: { user: User }) => {
  const statesToStepsMapping = new Map([
    [UserStates.Authenticated, 1],
    [UserStates.Registered, 2],
    [UserStates.Confirmed, 3],
  ]);

  const cognitoFormEntry = {
    Uid: user.sub,
  };
  const cognitoFormUrl = `https://www.cognitoforms.com/_30%C3%A8meCiel/CoworkingColiving30%C3%A8meCielRegistration?entry=${encodeURIComponent(
    JSON.stringify(cognitoFormEntry)
  )}`;

  const finishIcon = <FontAwesomeIcon icon={faCheck} />;
  const icons = {
    finish: finishIcon,
    error: null,
  };
  return (
    <>
      <Container>
        <Row>
          <Col>
            <Steps
              current={statesToStepsMapping.get(
                user.state ? user.state : UserStates.Authenticated
              )}
              icons={icons}
            >
              <Step
                title="Identification"
                description="Tu créés un compte PaxID"
              />
              <Step
                title="Inscription"
                description="Aide-moi à mieux te connaître"
              />
              <Step
                title="Confirmation"
                description="Je confirme ton inscription"
              />
              <Step
                title="C'est parti !"
                description="Tu reçois un e-mail de confirmation 😀"
              />
            </Steps>
          </Col>
        </Row>
        <br />
        <Row>
          <Col>
            <h2>Inscription</h2>
            <p>
              Avant de venir, <FontAwesomeIcon icon={faCoffee} /> j'ai besoin
              d'en savoir un peu plus sur toi. Est-ce que tu peux remplir ce
              formulaire ? Le rôle <strong>Participante</strong> va revenir vers
              toi pour la suite
            </p>
            <CognitoFormSeamless
              entry={cognitoFormEntry}
              onSubmit={() => {
                console.log("onSubmit")
              }}/>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default OnBoarding;
