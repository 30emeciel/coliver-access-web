import { Popover } from "antd"
import { ReactNode } from "react"


export default function WorkInProgress({children}:{children:ReactNode|ReactNode[]}) {

  return <Popover content={<div><p>Cette fonctionnalité n'est pas encore disponible.</p></div>} title="Pour bientôt">{children}</Popover>
}
