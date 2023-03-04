export default function ServerResponse(props) {
  const style = {
    height: 40,
    width: "100%",
    display: "flex",
    justifyContent: "left",
    alignItems: "left",
    verticalAlign: "middle",
    paddingTop: 10,
    paddingLeft: 10,
    marginBottom: 16,
    borderRadius: 5,
    backgroundColor: props.color
  }
  return (
    <div style={style}>
      <p>{props.text}</p>
    </div>
  )
}