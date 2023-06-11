import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import axios from "axios"
import ActionRow from "../../components/ActionRow"
import { iotWebHandlerEndpts } from "../../endpoints"
import { toast } from "react-toastify"

class AllActions extends Component {

    state = {
        actions: [],
        errors: {}
    }

    componentDidMount() {
        this.getActions()
    }

    getActions() {
        const reqData = { user_id: this.props.auth.user.id }
        axios
            .post(iotWebHandlerEndpts + "/web/action/all", reqData)
            .then(res => {
                this.setState({
                    actions: res.data
                })
            }
            )
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to get actions")
            })
    }

    deleteAction = uuid => {
        const reqData = { user_id: this.props.auth.user.id, uuid: uuid }
        axios
            .post(iotWebHandlerEndpts + "/web/action/delete", reqData)
            .then(() => {
                this.getActions()
                toast.success("Successfully deleted action")
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to delete action")
            }
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
                                        {this.state.actions.map(action => <ActionRow key={action.uuid} action={action} deleteAction={this.deleteAction} />)}
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
