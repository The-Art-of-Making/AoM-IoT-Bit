import { deleteIcon } from "../icons/icons"

export default function ActionRow(props) {
    return (
        <tr>
            <th scope="col" className="text-light">{props.action.name}</th>
            <td>{props.action.trigger_topic}</td>
            <td>{props.action.trigger_state}</td>
            <td>{ }</td>
            <td><div className="btn text-danger" onClick={() => props.deleteAction(props.action.uid)}>{deleteIcon}</div></td>
        </tr>
    )
}