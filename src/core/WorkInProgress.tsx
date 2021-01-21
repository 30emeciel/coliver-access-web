import { Popover } from "antd"
import { ReactNode } from "react"



const content = <div><p>Thank you for your interest, this feature is not yet available.</p></div>
export default function WorkInProgress({children}:{children:ReactNode|ReactNode[]}) {

  return <Popover content={content} title="Not available yet" trigger="click">{children}</Popover>
}
