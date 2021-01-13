import Layout, { Content, Footer, Header } from "antd/lib/layout/layout"
import { ErrorBoundary } from "react-error-boundary"
import { BrowserRouter } from "react-router-dom"
import PaxContext, { TPaxContext } from "src/core/paxContext"
import useUser from "src/core/usePax"
import "./App.less"
import { ErrorFallback } from "./ErrorFallback"
import { NavLinks } from "./NavLinks"
import { NoUserContent } from "./NoUserContent"
import { UserContent } from "./UserContent"

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

  return (
    <>
      <BrowserRouter>
        <PaxContext.Provider value={userContextValue}>
          <Layout className="layout">
            <Header>
              <div className="logo">
                <span role="img" aria-label="rainbow" style={{margin: "0px 8px 0 8px"}}>🌈</span>
                <span style={{color: "white"}}>Coliv'app</span>

              </div>
              <NavLinks />

            </Header>
            <Content style={{ padding: "8px 16px" }}>
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  {!isUserLoading && isUserAuthenticated ? (
                    <UserContent />
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
