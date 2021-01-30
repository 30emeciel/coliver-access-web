import { useAuth0 } from "@auth0/auth0-react"
import {
  faBook,
  faBookReader,
  faCalendarCheck,
  faChartPie,
  faEye,
  faMoneyCheck,
  faSignOutAlt,
  faUserClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Menu } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import Layout, { Content } from "antd/lib/layout/layout"
import SubMenu from "antd/lib/menu/SubMenu"
import { useContext } from "react"
import { useHistory, useLocation, useRouteMatch } from "react-router-dom"
import firebase from "src/core/myfirebase"
import PaxContext from "src/core/paxContext"
import { TPaxStates } from "src/models/Pax"
import WorkInProgress from "src/core/WorkInProgress"

export function NavLinks() {
  const history = useHistory()
  const pc = useContext(PaxContext)
  const { logout } = useAuth0()
  const location = useLocation()
  return (
    <>
      <Layout>
        <Content>
          <Menu mode="horizontal" theme="dark" selectedKeys={[location.pathname]} selectable={false}>
            {pc.doc && pc.doc.state === TPaxStates.Confirmed && (
              <>
                <Menu.Item key="/presence" icon={<FontAwesomeIcon icon={faUserClock} />} onClick={() => history.push("/presence")}>
                  Ma présence
                </Menu.Item>
                <Menu.Item
                  key="/bookings"
                  icon={<FontAwesomeIcon icon={faBookReader} />}
                  onClick={() => history.push("/bookings")}
                >
                  Mes réservations
                </Menu.Item>

                <Menu.Item icon={<FontAwesomeIcon icon={faMoneyCheck} />}>
                  <WorkInProgress>Mes contributions</WorkInProgress>
                </Menu.Item>

                <Menu.Item icon={<FontAwesomeIcon icon={faChartPie} />}>
                  <WorkInProgress>Statistiques</WorkInProgress>
                </Menu.Item>
                <SubMenu
                  disabled={!pc.doc?.isSupervisor}
                  key="supervisor"
                  icon={<FontAwesomeIcon className="mr-2" icon={faEye} />}
                  title="Supervisaire"
                >
                  <Menu.Item key="/pax" icon={<FontAwesomeIcon icon={faUsers} />} onClick={() => history.push("/pax")}>
                    Répertoire des pax
                  </Menu.Item>
                  <Menu.Item
                    key="/presences"
                    icon={<FontAwesomeIcon icon={faCalendarCheck} />}
                    onClick={() => history.push("/presences")}
                  >
                    Tableau des présences
                  </Menu.Item>
                </SubMenu>
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
