import { Image, Result } from "antd";
import cassé from "./cassé.jpg";

export function ErrorFallback({ error }: { error: Error; }) {
  return (
    <Result status="warning" title="Bravo ! Tu viens de trouver un bug dans notre application." subTitle={error.message} icon={<Image preview={false} alt="cassé" src={cassé} />} />
  );
}
