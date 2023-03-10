import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import axios from "axios"
import ActionRow from "../../components/ActionRow"
import { clientAuth } from "../../endpoints"

class AllActions extends Component {

    state = {
        actions: [],
        errors: {}
    }

    componentDidMount() {
        this.getActions()
    }

    getActions() {
        const reqData = { user: this.props.auth.user.id }
        axios
            .post(clientAuth + "/web/client/get_actions", reqData)
            .then(res => {
                this.setState({
                    actions: res.data
                })
            }
            )
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
    }

    deleteAction = action => {
        const reqData = { user: this.props.auth.user.id, uid: action }
        axios
            .post(clientAuth + "/web/client/delete_action", reqData)
            .then(res => {
                this.getActions()
                console.log(res)
            })
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
    }

    render() {
        return (
            <div className="row justify-content-center p-1 gap-1">
                <div className="card text-white bg-primary mb-3">
                    <div className="card-body bg-primary">
                        <div className="d-grid text-left p-3 rounded bg-primary" style={{ background: "#000e1d" }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">Actions</h4>
                                <Link className="btn text-light" to="new_action" style={{ textDecoration: "none" }}>+ Add Action</Link>
                            </div>
                            <hr />
                            <div className="d-flex mb-2">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Name</th>
                                            <th scope="col">Trigger Topic</th>
                                            <th scope="col">Trigger State</th>
                                            <th scope="col">Trigger Responses</th>
                                            <th scope="col">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.actions.map(action => <ActionRow key={action.uid} action={action} deleteAction={this.deleteAction} />)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

AllActions.propTypes = {
    auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
    auth: state.auth,
    errors: state.errors
})
export default connect(
    mapStateToProps
)(AllActions)
