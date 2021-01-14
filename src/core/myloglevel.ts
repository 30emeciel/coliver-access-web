import loglevel from "loglevel"

loglevel.setLevel(process.env.NODE_ENV === "development" ? "DEBUG" : "WARN")


export default loglevel
