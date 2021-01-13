import { useAuth0 } from "@auth0/auth0-react"
import { faCalendarCheck, faEye, faSignOutAlt, faUserClock, faUsers } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Menu } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import Layout, { Content } from "antd/lib/layout/layout"
import SubMenu from "antd/lib/menu/SubMenu"
import { useContext } from "react"
import { useHistory } from "react-router-dom"
import firebase from "src/core/firebase_config"
import PaxContext from "src/core/paxContext"
import { PaxStates } from "src/core/usePax"

export function NavLinks() {
  const history = useHistory()
  const pc = useContext(PaxContext)
  const { logout } = useAuth0()

  return (
    <>
      <Layout>
        <Content>
          <Menu mode="horizontal" theme="dark" selectable={false}>
            {pc.doc && pc.doc.state === PaxStates.Confirmed && (
              <>
                <Menu.Item icon={<FontAwesomeIcon icon={faUserClock} />} onClick={() => history.push("/")}>
                  Ma présence
                </Menu.Item>
                {pc.doc?.isSupervisor && (
                  <SubMenu
                    key="supervisor"
                    icon={<FontAwesomeIcon className="mr-2" icon={faEye} />}
                    title="Supervisaire"
                  >
                    <Menu.Item
                      key="setting:1"
                      icon={<FontAwesomeIcon icon={faUsers} />}
                      onClick={() => history.push("/pax")}
                    >
                      Répertoire des pax
                    </Menu.Item>
                    <Menu.Item
                      key="setting:2"
                      icon={<FontAwesomeIcon icon={faCalendarCheck} />}
                      onClick={() => history.push("/presences")}
                    >
                      Tableau des présences
                    </Menu.Item>
                  </SubMenu>
                )}
              </>
            )}
            {pc.isAuthenticated && (
              <SubMenu
                style={{ float: "right" }}
                title={
                  <>
                    {pc.doc?.picture && <Avatar size="default" src={pc.doc?.picture} />}
                    <span style={{ margin: "0px 0px 0px 8px" }}>{pc.doc?.name ? pc.doc.name : "-"}</span>
                  </>
                }
              >
                <Menu.Item
                  onClick={async () => {
                    await firebase.auth().signOut()
                    logout({ returnTo: window.location.origin })
                  }}
                  icon={<FontAwesomeIcon icon={faSignOutAlt} />}
                >
                  Logout
                </Menu.Item>
              </SubMenu>
            )}
          </Menu>
        </Content>
      </Layout>
    </>
  )
}
