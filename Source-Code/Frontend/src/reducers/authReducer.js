import {
  SET_CURRENT_USER,
  USER_LOADING,
  USER_UPDATED,
  GET_ERRORS
} from "../actions/types"

const isEmpty = require("is-empty")
const initialState = {
  isAuthenticated: false,
  user: {},
  loading: false,
  updated: false
}

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case SET_CURRENT_USER:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload),
        user: action.payload
      }
    case USER_LOADING:
      return {
        ...state,
        loading: true
      }
    case USER_UPDATED:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload),
        user: action.payload,
        updated: true
      }
    case GET_ERRORS:
      return {
        ...state,
        updated: false
      }
    default:
      return state
  }
}
