import 'rc-steps/assets/index.css';
import Steps, { Step } from 'rc-steps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCoffee } from '@fortawesome/free-solid-svg-icons';
import { Col, Container, Row } from 'react-bootstrap';

const OnBoarding = () => {

    const description = "test description"
    const finishIcon = <FontAwesomeIcon icon={faCheck}/>
    const icons = {
        finish: finishIcon,
        error: null,
    }
    return <>
        <Container>
            <Row>
                <Col>
        <Steps current={3} icons={icons}>
        <Step title="Identification" description="Tu créés un compte PaxID"/>
      <Step title="Inscription" description="Aide-moi à mieux te connaître"/>
      <Step title="Validation" description="Je valide ton inscription"/>
      <Step title="Réservation" description="Tu choisis les jours quand tu viens"/>
      <Step title="C'est parti !" description="Tu reçois un e-mail de confirmation et tu viens 😀"/>
    </Steps> 
    </Col>
    </Row>
    <br />
    <Row>
        <Col>

    
    <p>Avant de venir, <FontAwesomeIcon icon={faCoffee} /> j'ai besoin d'en savoir un peu plus sur toi. Est-ce que tu peux remplir ce formulaire ? La personne s'occupe du rôle <strong>Participante</strong> va revenir vers toi pour la suite</p>
    </Col>
    </Row>
    </Container>
    
    </>
  
}

export default OnBoarding
