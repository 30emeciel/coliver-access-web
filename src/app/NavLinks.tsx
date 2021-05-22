import { useAuth0 } from "@auth0/auth0-react"
import {
  faBaby,
  faBookReader,
  faCalendarCheck,
  faCertificate,
  faChartPie,
  faCheckDouble,
  faComments,
  faEye,
  faMoneyCheck,
  faPlus, faQuestionCircle,
  faSignOutAlt,
  faUsers,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Menu } from "antd"
import Avatar from "antd/lib/avatar/avatar"
import SubMenu from "antd/lib/menu/SubMenu"
import { useContext } from "react"
import { useHistory, useLocation } from "react-router-dom"
import firebase from "src/core/myfirebase"
import PaxContext from "src/core/paxContext"
import { TPaxStates } from "src/models/Pax"
import WorkInProgress from "src/core/WorkInProgress"
import { open as freshdeskOpen } from "src/core/freshdesk"

export function NavLinks({mobile, onParentMenuSelect}:{mobile:boolean, onParentMenuSelect?:() => void}) {
  const history = useHistory()
  const pc = useContext(PaxContext)
  const { logout } = useAuth0()
  const location = useLocation()

  const onMenuSelect = (path:string) => {
    history.push(path)
    if (onParentMenuSelect)
      onParentMenuSelect()
  }

  const freshDeskMenuItem = <Menu.Item
    style={mobile || pc.isAuthenticated ? {} : { float: "right" }}
    onClick={() => {freshdeskOpen()}}
      icon={<FontAwesomeIcon icon={faQuestionCircle} />}>Aide</Menu.Item>

  return (<>
      <Menu mode={mobile ? "inline" : "horizontal"} theme={mobile ? "light" : "dark"} selectedKeys={[location.pathname]}>
        {pc.doc && pc.doc.state === TPaxStates.Confirmed && (
          <>
            <Menu.Item
              key="/my-reservations"
              icon={<FontAwesomeIcon icon={faBookReader} />}
              onClick={() => onMenuSelect("/my-reservations")}
            >
              Mes réservations
            </Menu.Item>

            <Menu.Item key="my-contributions" icon={<FontAwesomeIcon icon={faMoneyCheck} />}>
              <WorkInProgress>Mes contributions</WorkInProgress>
            </Menu.Item>

            <SubMenu
              key="plus"
              icon={<FontAwesomeIcon icon={faPlus} />}
              title="Plus"
            >
              <Menu.Item icon={<FontAwesomeIcon icon={faComments} />}>
                <WorkInProgress>Communauté</WorkInProgress>
              </Menu.Item>
              <Menu.Item icon={<FontAwesomeIcon icon={faChartPie} />}>
                <WorkInProgress>Statistiques</WorkInProgress>
              </Menu.Item>
            </SubMenu>

            <SubMenu
              disabled={!pc.doc?.isSupervisor}
              key="supervisor"
              icon={<FontAwesomeIcon icon={faEye} />}
              title="Supervisaire"
            >
              <Menu.Item key="/supervisor/pax" icon={<FontAwesomeIcon icon={faUsers} />} onClick={() => onMenuSelect("/supervisor/pax")}>
                Répertoire des pax
              </Menu.Item>
              <Menu.Item key="/supervisor/reservations" icon={<FontAwesomeIcon icon={faCheckDouble} />} onClick={() => onMenuSelect("/supervisor/reservations")}>
                Réservations en attente
              </Menu.Item>
              <Menu.Item
                key="/supervisor/presence-summary"
                icon={<FontAwesomeIcon icon={faCalendarCheck} />}
                onClick={() => onMenuSelect("/supervisor/presence-summary")}
              >
                Tableau des présences
              </Menu.Item>
            </SubMenu>
          </>
        )}
        {freshDeskMenuItem}
        {pc.isAuthenticated && <>
          { mobile && <Menu.Divider />}
          <SubMenu
            style={mobile ? {} : { float: "right" }}
            icon={pc.doc?.picture && <Avatar style={{margin: "0 4px 0 0"}} size="small" src={pc.doc.picture} />}
            title={pc.doc?.name ? pc.doc.name : "-"}
          >
            <Menu.Item icon={<FontAwesomeIcon icon={faBaby} />}>
              <WorkInProgress>Niveau : Bébé Coliver</WorkInProgress>
            </Menu.Item>
            <Menu.Item icon={<FontAwesomeIcon icon={faCertificate} />}>
              <WorkInProgress>Badges</WorkInProgress>
            </Menu.Item>
            <Menu.Divider />
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
        </>
        }
      </Menu>
    </>
  )
}
