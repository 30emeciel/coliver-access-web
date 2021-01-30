import { Button, Image, Result } from "antd"
import cassé from "./cassé.jpg";
import {open as freshdeskOpen} from "src/core/freshdesk"

export function ErrorFallback({ error }: { error: Error; }) {
  const title = "Bravo ! Tu viens de trouver un bug dans notre application."
  const extra = <Button onClick={freshdeskOpen}>Envoyer une demande de support</Button>
  return (
    <Result status="warning" title={title} subTitle={error.message} icon={<Image preview={false} alt="cassé" src={cassé} />} extra={extra} />
  );
}
