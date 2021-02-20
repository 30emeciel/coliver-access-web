import Layout, { Content, Footer, Header } from "antd/lib/layout/layout"
import { ErrorBoundary } from "react-error-boundary"
import { BrowserRouter } from "react-router-dom"
import PaxContext, { TPaxContext } from "src/core/paxContext"
import useUser from "src/core/usePax"
import OnBoarding from "src/OnBoarding/OnBoarding"
import "./App.less"
import "./react-collapse.css"
import { ErrorFallback } from "./ErrorFallback"
import { NavLinks } from "./NavLinks"
import { NoUserContent } from "./NoUserContent"
import { UserContent } from "./UserContent"
import { TPaxStates } from "../models/Pax"
import { Button, Col, Drawer, Row } from "antd"
import { MenuOutlined } from "@ant-design/icons"
import { useState } from "react"

const App = () => {
  const {
    isLoading: isUserLoading,
    isAuthenticated: isUserAuthenticated,
    userData: userDoc,
    docRef: userDocRef,
  } = useUser()

  const userContextValue: TPaxContext = {
    isLoading: isUserLoading,
    isAuthenticated: isUserAuthenticated,
    doc: userDoc,
    ref: userDocRef,
  }
  const [mobileMenuOpened, setMobileMenuOpened] = useState(false)
  const switchMobileMenu = () => {
    setMobileMenuOpened(!mobileMenuOpened)
  }

  return (
    <>
      <BrowserRouter>
        <PaxContext.Provider value={userContextValue}>
          <Layout className="layout">
            <Header>
              <Row>
                <Col span={1}>
                  <span role="img" aria-label="rainbow" style={{ margin: "0px 8px 0 8px" }}>🌈</span>
                </Col>
                <Col xs={{span: 0}} md={{span: 0}} lg={{span: 0}} xxl={{span: 1}}>
                  <span style={{ color: "white" }}>Coliv'app</span>
                </Col>
                <Col xs={{span: 0}} lg={{span: 23}} xxl={{span: 22}}>
                  <NavLinks mobile={false} />
                </Col>
                <Col xs={{span: 23}} md={{span: 23}} lg={{span: 0}} style={{textAlign: "end"}}>
                  <Button style={{marginRight: 16}} icon={<MenuOutlined  />} onClick={switchMobileMenu}/>
                  <Drawer visible={mobileMenuOpened} onClose={switchMobileMenu} closeIcon={null} width="300">
                    <NavLinks mobile={true} onParentMenuSelect={switchMobileMenu} />
                  </Drawer>
                </Col>
              </Row>
            </Header>
            <Content style={{padding: "8px 16px"}}>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                {!isUserLoading && isUserAuthenticated && userDoc ? (
                  userDoc.state === TPaxStates.Confirmed ?
                    <UserContent /> : <OnBoarding />
                ) : (
                  <NoUserContent isUserLoading={isUserLoading} />
                )}
              </ErrorBoundary>
            </Content>
            <Footer style={{ textAlign: "center" }}>30ème Ciel 🌈</Footer>
          </Layout>
        </PaxContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
