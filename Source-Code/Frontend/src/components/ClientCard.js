import { editIcon, deleteIcon } from "../icons/icons"

export default function ClientCard(props) {
    const devices = props.devices.filter(device => device.client_username === props.client.username)
    return (
        <div className="card text-white bg-primary pb-3" style={{ maxWidth: (props.maxWidth ? props.maxWidth : "24.7%") }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
                {props.client.name}
                <div>
                    <button className="btn text-warning">{editIcon}</button>
                    <div className="btn text-danger" onClick={() => props.deleteClient(props.client.username)}>{deleteIcon}</div>
                </div>
            </div>
            <div className="card-body bg-primary">
                {devices.map(device =>
                    <div key={device.uid} className="d-flex">
                        <p className="text-white"><span className="text-light" style={{ fontWeight: "bold" }}>&#8627;&ensp;</span>{device.name}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
