import { useState } from "react"
import { editIcon, checkIcon, deleteIcon, checkCircleIcon, xCircleIcon } from "../icons/icons"

export default function ClientCard(props) {
    const [edit, setEdit] = useState(false)
    const [name, setName] = useState(props.client.name)
    const devices = props.devices.filter(device => device.client_uuid === props.client.uuid)
    return (
        <div className="card text-white bg-primary pb-3" style={{ maxWidth: (props.maxWidth ? props.maxWidth : "24.7%") }}>
            <div className="card-header d-flex justify-content-between align-items-center" style={{ fontWeight: "bold" }}>
                {(edit) ? <input type="text" className="form-control border-secondary" onChange={e => setName(e.target.value)} value={name} placeholder={name}></input> : props.client.name}
                <div>
                    {(edit)
                        ? <>
                            <div className="btn text-success" onClick={() => {
                                props.editClient(props.client.uuid, name)
                                setEdit(false)
                            }}>{checkIcon}</div>
                        </>
                        : <>
                            <div className="btn text-warning" onClick={() => setEdit(true)}>{editIcon}</div>
                            <div className="btn text-danger" onClick={() => props.deleteClient(props.client.uuid)}>{deleteIcon}</div>
                        </>
                    }
                </div>
            </div>
            <div className="card-body bg-primary">
                <p className="card-text">Status:&ensp;{props.connected ? <span className="text-success">{checkCircleIcon}Connected</span> : <span className="text-danger">{xCircleIcon}Disconnected</span>}</p>
                <p className="card-text">Devices:</p>
                {devices.map(device =>
                    <div key={device.uuid} className="d-flex">
                        <p className="text-secondary"><span className="text-light" style={{ fontWeight: "bold" }}>&#8627;&ensp;</span>{device.name}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
