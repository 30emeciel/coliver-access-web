import { useAuth0 } from "@auth0/auth0-react";
import {
  faSignInAlt,



  faUserPlus
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Row, Spin } from "antd";
import Layout, { Content } from "antd/lib/layout/layout";

export function NoUserContent({ isUserLoading }: { isUserLoading: boolean; }) {
  const { loginWithRedirect, isLoading } = useAuth0();

  return (
    <Layout>
      <Content>
        <h1 className="header">Bienvenue sur l'appli Coliv du 30ème Ciel</h1>
        <h2 className="header">L'application de gestion des présences du 30ème Ciel.</h2>
        <hr />
        <br />
        {isUserLoading ? (
          <Row>
            <Spin />
          </Row>
        ) : (
            <>
              <Row>
                <Button
                  icon={<FontAwesomeIcon icon={faSignInAlt} className="anticon" />}
                  size="large"
                  type="primary"
                  block
                  loading={isLoading}
                  onClick={() => loginWithRedirect( /*auth0_options*/)}
                >
                  Me connecter avec mon compte PaxID
                </Button>
              </Row>
              <br />
              <Row>
                <Button icon={<FontAwesomeIcon className="anticon" icon={faUserPlus} />} size="large"
                  type="default"
                  block
                  loading={isLoading} onClick={() => loginWithRedirect( /*auth0_options*/)}>
                  Je suis nouveau, je veux créer mon compte PaxID
                </Button>
              </Row>
            </>
          )}
      </Content>
    </Layout>
  );
}