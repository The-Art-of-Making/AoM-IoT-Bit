import { Component } from "react"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import classnames from "classnames"
import { updateAccountInfo } from "../actions/authActions"
import { LoadingIndicator } from "../components/LoadingIndicator"
import ServerResponse from "../components/ServerResponse"
import WithRouter from "../components/WithRouter"
import Header from "../components/Header"

class Account extends Component {

  state = {
    email: "",
    password: "",
    password2: "",
    submit: false,
    errors: {}
  }

  componentDidUpdate() {
    if (this.state.errors !== this.props.errors && this.state.submit) {
      this.setState({
        errors: this.props.errors
      })
    }
  }

  onChange = e => {
    this.setState({
      [e.target.id]: e.target.value
    })
  }

  onSubmit = e => {
    e.preventDefault()
    const updatedInfo = {
      id: this.props.auth.user.id,
      email: this.state.email,
      password: this.state.password,
      password2: this.state.password2
    }
    this.props.updateAccountInfo(updatedInfo)
    this.setState({ submit: true })
  }

  render() {
    const { errors } = this.state

    return (
      <div>
        <Header />
        <hr className="my-5" style={{ visibility: "hidden" }}></hr>
        <form noValidate onSubmit={this.onSubmit}>
          <div className="container">
            <div className="d-flex justify-content-center h-100 row align-items-center">
              <div className="col card p-3 m-3 bg-primary">
                <div className="card-header mb-3">Update Account Information</div>
                <LoadingIndicator text="Updating Account Info..." />
                {
                  (this.props.auth.updated) ? <ServerResponse color="mediumseagreen" text="Account Info Successfully Updated." /> :
                    (Object.keys(this.state.errors).length === 0) ? null : <ServerResponse color="red" text="Failed to Update Account." />
                }
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input className={classnames((errors.email !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.email })} onChange={this.onChange} value={this.state.email} placeholder={this.props.auth.user.email} error={errors.email} id="email" type="email" />
                  {(errors.email) ? <><small className="form-text text-danger">{errors.email}</small><br /></> : null}
                  <label>Password</label>
                  <input className={classnames((errors.password !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.password })} onChange={this.onChange} value={this.state.password} placeholder="Password" error={errors.password} id="password" type="password" />
                  {(errors.password) ? <><small className="form-text text-danger">{errors.password}</small><br /></> : null}
                  <label>Confirm Password</label>
                  <input className={classnames((errors.password2 !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.password2 })} onChange={this.onChange} value={this.state.password2} placeholder="Confirm Password" error={errors.password2} id="password2" type="password" />
                  {(errors.password2) ? <><small className="form-text text-danger">{errors.password2}</small><br /></> : null}
                </div>
                <button className="btn btn-success" type="submit">Update</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

Account.propTypes = {
  updateAccountInfo: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
})
export default connect(
  mapStateToProps,
  { updateAccountInfo }
)(WithRouter(Account))