import React from "react"
import { Navigate } from "react-router-dom"
import { connect } from "react-redux"
import PropTypes from "prop-types"

const PrivateRoute = ({ children, auth }) => {
  return (
    auth.isAuthenticated === true ? (
      children
    ) : (
      <Navigate to="/login" />
    )
  )
}

PrivateRoute.propTypes = {
  auth: PropTypes.object.isRequired
}
const mapStateToProps = state => ({
  auth: state.auth
})
export default connect(mapStateToProps)(PrivateRoute)
