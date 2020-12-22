import { Button } from "react-bootstrap"

const LoadingButton = ({
    disabled,
    variant,
    onClick,
    isLoading,
    children,
} :
{
    disabled?: boolean,
    variant?: string,
    onClick: () => void,
    isLoading: boolean,
    children: string

}

) => {

    return <Button disabled={disabled} variant={variant} onClick={onClick}>
                {isLoading ? "Loading..." : children }
            </Button>

}

export default LoadingButton