import { Component } from "react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../../actions/authActions"
import axios from "axios"
import classnames from "classnames"
import { checkIcon, deleteIcon } from "../../icons/icons"
import { iotWebHandlerEndpts } from "../../endpoints"
import { toast } from "react-toastify"

class NewClient extends Component {

    state = {
        name: "",
        wifiSSID: "",
        wifiPassword: "",
        errors: {}
    }

    onChange = e => {
        this.setState({
            [e.target.id]: e.target.value
        })
    }

    downloadConfigFile = (uuid, token) => {
        const element = document.createElement("a");
        const file = new Blob([this.state.wifiSSID + ";" + this.state.wifiPassword + ";" + uuid + ";" + token], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "secrets.txt";
        document.body.appendChild(element);
        element.click();
    }

    onSubmit = e => {
        e.preventDefault()
        const newClient = {
            user_id: this.props.auth.user.id,
            name: this.state.name,
            wifi_ssid: this.state.wifiSSID,
            wifi_password: this.state.wifiPassword
        }
        axios
            .post(iotWebHandlerEndpts + "/web/client/register", newClient)
            .then(res => {
                this.downloadConfigFile(res.data.uuid, res.data.token)
                this.setState({
                    errors: {}
                })
                toast.success("Successfully added new client")
            })
            .catch(err => {
                this.setState({
                    errors: err.response.data
                })
                toast.error("Failed to add new client")
            })
    }

    render() {

        const { errors } = this.state

        return (
            <form noValidate onSubmit={this.onSubmit}>
                <div className="container">
                    <div className="d-flex justify-content-center h-100 row align-items-center">
                        <div className="col card p-3 m-3 bg-primary">
                            <div className="card-header mb-3">New Client</div>
                            <div className="form-group mb-2">
                                <label>Name</label>
                                <input
                                    className={classnames((errors.name !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.name })}
                                    onChange={this.onChange}
                                    value={this.state.name}
                                    placeholder="Client Name"
                                    error={errors.name}
                                    id="name"
                                    type="text"
                                />
                                {(errors.name) ? <><small className="form-text text-danger">{errors.name}</small><br /></> : null}
                                <label className="mt-3">Wifi SSID</label>
                                <input
                                    className={classnames((errors.wifi_ssid !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.wifi_ssid })}
                                    onChange={this.onChange}
                                    value={this.state.wifiSSID}
                                    placeholder="Wifi SSID"
                                    error={errors.wifi_ssid}
                                    id="wifiSSID"
                                    type="text"
                                />
                                {(errors.wifi_ssid) ? <><small className="form-text text-danger">{errors.wifi_ssid}</small><br /></> : null}
                                <label className="mt-3">Wifi Password</label>
                                <input
                                    className={classnames((errors.wifi_password !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.wifi_password })}
                                    onChange={this.onChange}
                                    value={this.state.wifiPassword}
                                    placeholder="Wifi Password"
                                    error={errors.wifi_password}
                                    id="wifiPassword"
                                    type="password"
                                />
                                {(errors.wifi_password) ? <><small className="form-text text-danger">{errors.wifi_password}</small><br /></> : null}
                            </div>
                            <div className="d-flex flex-row-reverse">
                                <button className="btn text-success" type="submit">{checkIcon} Add Client</button>
                                <Link className="btn text-danger" to="/clients" style={{ textDecoration: "none" }}>{deleteIcon} Cancel</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        )
    }
}

NewClient.propTypes = {
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
)(NewClient)