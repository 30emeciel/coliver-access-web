import { Button, Spinner } from "react-bootstrap"

const LoadingButton = ({
  className,
  disabled,
  variant,
  onClick,
  isLoading,
  children,
}: {
  className?: string
  disabled?: boolean
  variant?: string
  onClick?: () => void
  isLoading: boolean
  children: any
}) => {
  return (
    <Button className={className} disabled={disabled} variant={variant} onClick={onClick}>
      {isLoading ? (
        <>
          {" "}
          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Loading...
        </>
      ) : (
        children
      )}
    </Button>
  )
}

export default LoadingButton
