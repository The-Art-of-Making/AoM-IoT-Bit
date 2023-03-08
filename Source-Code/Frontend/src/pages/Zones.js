import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../actions/authActions"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import UnderConstruction from "../components/UnderContruction"

class Zones extends Component {

    onLogoutClick = e => {
        e.preventDefault()
        this.props.logoutUser()
    }

    render() {
        return (
            <div className="d-flex">
                <Sidebar currentItem="Zones" />
                <div className="flex-column flex-grow-1">
                    <div className="d-grid gap-1">
                        <Header user={this.props.auth.user} onLogoutClick={this.onLogoutClick} />
                    </div>
                    <div className="container-fluid">
                        <UnderConstruction />
                    </div>
                </div>
            </div>
        )
    }
}

Zones.propTypes = {
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
)(Zones)