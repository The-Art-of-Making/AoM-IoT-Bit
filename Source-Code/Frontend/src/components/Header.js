import { useState } from "react"
import { Link } from "react-router-dom"
import NavbarLink from "./NavbarLink"

export default function Header(props) {
    const [show, setShow] = useState("show")
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                {(props.user) ? null : <Link style={{ textDecoration: "none" }} to="/dashboard">
                    <div className="navbar-brand">AoM IoT</div>
                </Link>}
                <button className="navbar-toggler" type="button" onClick={() => setShow(show === "show" ? "" : "show")}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={"collapse navbar-collapse " + show}>
                    <ul className="navbar-nav me-auto">
                        <NavbarLink to="/" title="Page" />
                        <NavbarLink to="/" title="History" />
                        <NavbarLink to="/" title="Breadcrumbs" />
                    </ul>
                    {(props.user) ? <div className="d-flex">
                        <div className="btn-group m-1">
                            <Link style={{ textDecoration: "none" }} to="/account"><button className="btn btn-outline-warning"><i className="fas fa-user-circle"></i>{props.user.email}</button></Link>
                        </div>
                        <div className="btn-group m-1">
                            <button className="btn btn-outline-danger" onClick={props.onLogoutClick}><i className="fas fa-sign-out-alt"></i>Logout</button>
                        </div>
                    </div> : null}
                </div>
            </div>
        </nav>
    )
}
