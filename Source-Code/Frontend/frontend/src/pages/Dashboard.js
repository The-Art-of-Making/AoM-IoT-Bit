import { Component } from "react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"

class Dashboard extends Component {

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    render() {
        const { user } = this.props.auth
        return (
            <>
                <h1>Dashboard</h1>
                <div className="btn-group m-1">
                    <Link style={{ textDecoration: "none" }} to="/account"><button className="btn btn-outline-warning"><i className="fas fa-user-circle"></i>{user.email}</button></Link>
                </div>
                <div className="btn-group m-1">
                    <button className="btn btn-outline-danger" onClick={this.onLogoutClick}><i className="fas fa-sign-out-alt"></i>Logout</button>
                </div>
            </>
        )
    }
}

Dashboard.propTypes = {
    logoutUser: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
})
export default connect(
    mapStateToProps,
    { logoutUser }
)(Dashboard)