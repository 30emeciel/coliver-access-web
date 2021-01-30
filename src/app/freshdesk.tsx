import { Helmet } from "react-helmet"
import { useEffect } from "react"


declare function FreshworksWidget(s: string, s2?: any): void


export default function Freshdesk() {

  (window as any).fwSettings = {
    "widget_id": 69000000672
  }

  const authenticateCallback = () => {

  }

  const onLoad = () => {
    FreshworksWidget("show")
    FreshworksWidget('authenticate', {
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiam9obkB0ZXN0LmNvbSIsImVtYWlsIjoiam9obkB0ZXN0LmNvbSIsImV4cCI6MTYxMTk0OTA0MX0.WPq6vl7k_uEVhCIJDXJ_htDvrLJ0qH3VyJtaSZkta_k',
      callback: authenticateCallback
    });

  }

  useEffect(() => {
    return () => {
      FreshworksWidget("hide")
    }
  })
  return <>
    <Helmet>
      <script onLoad={onLoad} type="text/javascript" src="https://widget.freshworks.com/widgets/69000000672.js" async defer />
    </Helmet>
  </>
}
