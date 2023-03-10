import { Component } from "react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { logoutUser } from "../../actions/authActions"
import axios from "axios"
import classnames from "classnames"
import { checkIcon, deleteIcon } from "../../icons/icons"
import { clientAuth } from "../../endpoints"

class NewClient extends Component {

    state = {
        name: "",
        errors: {}
    }

    onChange = e => {
        this.setState({
            [e.target.id]: e.target.value
        })
    }

    downloadConfigFile = (username, password) => {
        const element = document.createElement("a");
        const file = new Blob([username + ";" + password], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "secrets.txt";
        document.body.appendChild(element);
        element.click();
    }

    onSubmit = e => {
        e.preventDefault()
        const newClient = { user: this.props.auth.user.id, name: this.state.name }
        axios
            .post(clientAuth + "/web/client/register", newClient)
            .then(res => {
                this.downloadConfigFile(res.data.username, res.data.password)
                console.log(res)
            })
            .catch(err =>
                this.setState({
                    errors: err.response.data
                })
            )
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
                                <input className={classnames((errors.name !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.name })} onChange={this.onChange} value={this.state.name} placeholder="Client Name" error={errors.name} id="name" type="text" />
                                {(errors.name) ? <><small className="form-text text-danger">{errors.name}</small><br /></> : null}
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