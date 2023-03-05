import { useState } from "react"
import { Link } from "react-router-dom"
// import PropTypes from "prop-types"
// import { connect } from "react-redux"
// import { logoutUser } from "../actions/authActions"

export default function Header(props) {
    const [show, setShow] = useState("show")
    // const { user } = this.props.auth
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container-fluid">
                <Link style={{ textDecoration: "none" }} to="/dashboard">
                    <div className="navbar-brand">AoM IoT</div>
                </Link>
                <button className="navbar-toggler" type="button" onClick={() => setShow(show === "show" ? "" : "show")}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={"collapse navbar-collapse " + show}>
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link style={{ textDecoration: "none" }} to="/find_feed">
                                <div className={"nav-link " + (props.current === "find_feed" ? "active" : "")}>Find Feed</div>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link style={{ textDecoration: "none" }} to="/new_feed">
                                <div className={"nav-link " + (props.current === "new_feed" ? "active" : "")}>New Feed</div>
                            </Link>
                        </li>
                    </ul>
                    <div className="d-flex">
                        <div className="btn-group m-1">
                            {/* <Link style={{ textDecoration: "none" }} to="/account"><button className="btn btn-outline-warning"><i className="fas fa-user-circle"></i>{user.email}</button></Link> */}
                            <Link style={{ textDecoration: "none" }} to="/account"><button className="btn btn-outline-warning"><i className="fas fa-user-circle"></i>test@example.com</button></Link>
                        </div>
                        <div className="btn-group m-1">
                            {/* <button className="btn btn-outline-danger" onClick={this.onLogoutClick}><i className="fas fa-sign-out-alt"></i>Logout</button> */}
                            <button className="btn btn-outline-danger"><i className="fas fa-sign-out-alt"></i>Logout</button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}

// Header.propTypes = {
//     logoutUser: PropTypes.func.isRequired,
//     auth: PropTypes.object.isRequired
// }
// const mapStateToProps = state => ({
//     auth: state.auth,
//     errors: state.errors
// })
// export default connect(
//     mapStateToProps,
//     { logoutUser }
// )(Header)