import React from "react"
import { usePromiseTracker } from "react-promise-tracker"
import { Bars } from "react-loader-spinner"

export const LoadingIndicator = props => {
  const { promiseInProgress } = usePromiseTracker()
  const style = {
    height: 40,
    width: "100%",
    display: "flex",
    justifyContent: "left",
    alignItems: "left",
    verticalAlign: "middle",
    paddingTop: 10,
    borderRadius: 5,
    backgroundColor: "orange"
  }
  return (
    promiseInProgress &&
    <div style={style}>
      <Bars type="Bars" width="100" height="20" color="white" />
      <p>{props.text}</p>
    </div>
  )
}