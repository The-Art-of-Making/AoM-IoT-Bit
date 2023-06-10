import { Component } from "react"
import { Link } from "react-router-dom"
import classnames from "classnames"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { registerUser } from "../actions/authActions"
import WithRouter from "../components/WithRouter"
import Header from "../components/Header"

class Register extends Component {

  state = {
    email: "",
    password: "",
    password2: "",
    submit: false,
    errors: {}
  }

  componentDidMount() {
    // If logged in and user navigates to Register page, should redirect them to dashboard
    if (this.props.auth.isAuthenticated) {
      this.props.navigate("/dashboard")
    }
  }

  componentDidUpdate() {
    if (this.props.auth.isAuthenticated) {
      this.props.navigate("/dashboard")
    }
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
    const newUser = {
      email: this.state.email,
      password: this.state.password,
      password2: this.state.password2
    }
    this.props.registerUser(newUser, this.props.navigate)
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
                <div className="card-header mb-3">Register Account</div>
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input className={classnames((errors.email !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.email })} onChange={this.onChange} value={this.state.email} placeholder="Email" error={errors.email} id="email" type="email" />
                  {(errors.email) ? <><small className="form-text text-danger">{errors.email}</small><br /></> : null}
                  <label className="mt-3">Password</label>
                  <input className={classnames((errors.password !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.password })} onChange={this.onChange} value={this.state.password} placeholder="Password" error={errors.password} id="password" type="password" />
                  {(errors.password) ? <><small className="form-text text-danger">{errors.password}</small><br /></> : null}
                  <label className="mt-3">Confirm Password</label>
                  <input className={classnames((errors.password2 !== undefined) ? "form-control is-invalid" : "form-control", { invalid: errors.password2 })} onChange={this.onChange} value={this.state.password2} placeholder="Confirm Password" error={errors.password2} id="password2" type="password" />
                  {(errors.password2) ? <><small className="form-text text-danger">{errors.password2}</small><br /></> : null}
                </div>
                <p>Already have an account? <Link className="link text-light" to="/login">Login</Link></p>
                <p>Return to <Link className="link text-light" to="/">Home</Link></p>
                <button className="btn btn-success" type="submit">Register</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

Register.propTypes = {
  registerUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
})
export default connect(
  mapStateToProps,
  { registerUser }
)(WithRouter(Register))
