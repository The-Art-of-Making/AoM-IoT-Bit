export default function Card(props) {
    return (
        <div className="card text-white bg-primary" style={{ maxWidth: props.maxWidth }}>
            <div className="card-body bg-primary">
                <div className="bg-dark d-grid text-center py-5 rounded">
                    <h3>{props.title}</h3>
                    <h2 className={props.textFormat}>{props.stat}</h2>
                </div>
            </div>
        </div>
    )
}