import axios from "axios"
import setAuthToken from "../utils/setAuthToken"
import jwt_decode from "jwt-decode"
import {
  GET_ERRORS,
  SET_CURRENT_USER,
  USER_LOADING,
  USER_UPDATED
} from "./types"
import { trackPromise } from "react-promise-tracker"

// Register User
export const registerUser = (userData, navigate) => dispatch => {
  // add promise tracker for registering new user
  axios
    .post("/api/users/register", userData)
    .then(res => navigate("/login")) // re-direct to login on successful register
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    )
}

// Login - get user token
export const loginUser = userData => dispatch => {
  axios
    .post("/api/users/login", userData)
    .then(res => {
      // Save to localStorage
      // Set token to localStorage
      const { token } = res.data
      localStorage.setItem("jwtToken", token)
      // Set token to Auth header
      setAuthToken(token)
      // Decode token to get user data
      const decoded = jwt_decode(token)
      // Set current user
      dispatch({
        type: GET_ERRORS,
        payload: {}
      })
      dispatch(setCurrentUser(decoded))
    })
    .catch(err =>
      dispatch({
        type: GET_ERRORS,
        payload: err.response.data
      })
    )
}

// Set logged in user
export const setCurrentUser = decoded => {
  return {
    type: SET_CURRENT_USER,
    payload: decoded
  }
}

// User loading
export const setUserLoading = () => {
  return {
    type: USER_LOADING
  }
}

// Set logged in user
export const updateCurrentUser = decoded => {
  return {
    type: USER_UPDATED,
    payload: decoded
  }
}

// Update User account info
export const updateAccountInfo = userData => dispatch => {
  trackPromise(
    axios
      .post("/api/users/updateAccountInfo", userData)
      .then(res => {
        // Save to localStorage
        // Set token to localStorage
        const { token } = res.data
        localStorage.setItem("jwtToken", token)
        // Set token to Auth header
        setAuthToken(token)
        // Decode token to get user data
        const decoded = jwt_decode(token)
        // Set current user
        dispatch({
          type: GET_ERRORS,
          payload: {}
        })
        dispatch(updateCurrentUser(decoded))
      })
      .catch(err =>
        dispatch({
          type: GET_ERRORS,
          payload: err.response.data
        })
      )
  )
}

// Log user out
export const logoutUser = () => dispatch => {
  // Remove token from local storage
  localStorage.removeItem("jwtToken")
  // Remove auth header for future requests
  setAuthToken(false)
  // Set current user to empty object {} which will set isAuthenticated to false
  dispatch(setCurrentUser({}))
}
