import Layout, { Content, Footer, Header } from "antd/lib/layout/layout"
import { ErrorBoundary } from "react-error-boundary"
import { BrowserRouter } from "react-router-dom"
import PaxContext, { TPaxContext } from "src/core/paxContext"
import useUser from "src/core/usePax"
import "./App.less"
import { ErrorFallback } from "./ErrorFallback"
import { NavLinks } from "./NavLinks"
import { Router } from "./Router"
import { Button, Col, Divider, Drawer, Row, Spin } from "antd"
import { MenuOutlined } from "@ant-design/icons"
import { useState } from "react"
import { getEnvOrFail } from "src/core/getEnvOrFail"
import Text from "antd/es/typography/Text"
import { Login } from "./Login"

const VERSION = getEnvOrFail("VERSION")

const App = () => {
  const {
    isLoading: isPaxLoading,
    isAuthenticated: isUserAuthenticated,
    paxData: userDoc,
    paxDocRef: userDocRef
  } = useUser()

  const userContextValue: TPaxContext = {
    isLoading: isPaxLoading,
    isAuthenticated: isUserAuthenticated,
    doc: userDoc,
    ref: userDocRef
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
              <Row justify="space-between">
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
                {isPaxLoading ? <Spin size="large"><Login /></Spin> : <Router />}
              </ErrorBoundary>
            </Content>
            <Footer><Divider plain><Text type="secondary">Fait avec ❤ au 30ème Ciel 🌈 - {VERSION}</Text></Divider></Footer>
          </Layout>
        </PaxContext.Provider>
      </BrowserRouter>
    </>
  )
}

export default App
