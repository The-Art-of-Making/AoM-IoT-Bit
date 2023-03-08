import { Component } from "react"
import { Outlet } from "react-router-dom"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../../actions/authActions"
import Header from "../../components/Header"
import Sidebar from "../../components/Sidebar"

class Clients extends Component {

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    render() {
        return (
            <div className="d-flex">
                <Sidebar currentItem="Clients" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <Outlet />
                    </div>
                </div>
            </div>
        )
    }
}

Clients.propTypes = {
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
)(Clients)