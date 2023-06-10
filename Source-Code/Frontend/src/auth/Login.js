import { Component } from "react"
import { Link } from "react-router-dom"
import classnames from "classnames"
import PropTypes from "prop-types"
import { connect } from "react-redux"
import { loginUser } from "../actions/authActions"
import WithRouter from "../components/WithRouter"
import Header from "../components/Header"

class Login extends Component {

  state = {
    email: "",
    password: "",
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
    const userData = {
      email: this.state.email,
      password: this.state.password
    }
    this.props.loginUser(userData) // since we handle the redirect within our component, we don't need to pass in this.props.navigate as a parameter
    this.setState({ submit: true })
  }

  render() {
    const { errors } = this.state
    const validity = (
      errors.emailPasswordIncorrect !== undefined
    ) ? "form-control is-invalid" : "form-control"

    return (
      <div>
        <Header />
        <hr className="my-5" style={{ visibility: "hidden" }}></hr>
        <form noValidate onSubmit={this.onSubmit}>
          <div className="container">
            <div className="d-flex justify-content-center h-100 row align-items-center">
              <div className="col card p-3 m-3 bg-primary">
                <div className="card-header mb-3">Login</div>
                <span className="form-text text-danger">
                  {errors.emailPasswordIncorrect}
                </span>
                <div className="form-group mb-3">
                  <label>Email</label>
                  <input
                    onChange={this.onChange}
                    value={this.state.email}
                    error={errors.email}
                    id="email"
                    type="text"
                    placeholder="Email"
                    className={classnames((errors.email !== undefined) ? "form-control is-invalid" : validity, {
                      invalid: errors.email || errors.emailPasswordIncorrect
                    })}
                  />
                  <small className="form-text text-danger">
                    {errors.email}
                  </small>
                </div>
                <div className="form-group mb-3">
                  <label>Password</label>
                  <input
                    onChange={this.onChange}
                    value={this.state.password}
                    error={errors.password}
                    id="password"
                    type="password"
                    placeholder="Password"
                    className={classnames((errors.password !== undefined) ? "form-control is-invalid" : validity, {
                      invalid: errors.password || errors.emailPasswordIncorrect
                    })}
                  />
                  <small className="form-text text-danger">
                    {errors.password}
                  </small>
                </div>
                <p>Don't have an account? <Link className="link" to="/register">Register</Link></p>
                <p>Return to <Link className="link" to="/">Home</Link></p>
                <button className="btn btn-success" type="submit">Login</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

Login.propTypes = {
  loginUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
  auth: state.auth,
  errors: state.errors
})
export default connect(
  mapStateToProps,
  { loginUser }
)(WithRouter(Login))
