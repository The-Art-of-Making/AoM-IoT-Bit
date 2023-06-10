import { coneIcon } from "../icons/icons"

export default function UnderConstruction(props) {
    return (
        <div className="d-flex align-items-center justify-content-center mt-2 text-center" style={{ height: (props.height) ? props.height : "90vh" }}>
            <div className="d-col">
                {coneIcon}
                <h3>Under Construction</h3>
                <p>Feature coming soon...</p>
            </div>
        </div>
    )
}
