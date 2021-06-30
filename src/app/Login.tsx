import { useAuth0 } from "@auth0/auth0-react"
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Button, Divider, Row } from "antd"
import Layout, { Content } from "antd/lib/layout/layout"

export function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <Layout>
      <Content>
        <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
        <Divider />
        <br />
          <Row>
            <Button
              icon={<FontAwesomeIcon icon={faSignInAlt} />}
              size="large"
              type="primary"
              block
              loading={isLoading}
              onClick={() => loginWithRedirect()}
            >
              Connexion
            </Button>
          </Row>
          <br />
          <Row>
            <Button icon={<FontAwesomeIcon icon={faUserPlus} />} size="large"
              type="default"
              block
              loading={isLoading} onClick={() => loginWithRedirect({ screen_hint: 'signup' })}>
              Je suis nouveau, je veux créer mon compte
            </Button>
          </Row>
      </Content>
    </Layout>
  );
}
