export default function CardInfo(props) {
    return (
        <div className="d-flex">
            <p className="card-text" style={{ fontWeight: "bold" }}>{props.info}:&ensp;</p>
            <p className={props.textStyle}>{props.value}</p>
        </div>
    )
}