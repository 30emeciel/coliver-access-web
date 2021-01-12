import { Button } from "antd"
import { ButtonType } from "antd/lib/button"


const LoadingButton = ({
  className,
  disabled,
  type,
  onClick,
  isLoading,
  children,
}: {
  className?: string
  disabled?: boolean
  type?: ButtonType
  onClick?: () => void
  isLoading: boolean
  children: any
}) => {
  return (
    <Button loading={isLoading} className={className} disabled={disabled} type={type} onClick={onClick}>
        {children}
    </Button>
  )
}

export default LoadingButton
