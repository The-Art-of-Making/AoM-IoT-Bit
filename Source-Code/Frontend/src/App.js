import { Component } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Provider } from "react-redux"
import jwt_decode from "jwt-decode"
import store from "./store"
import setAuthToken from "./utils/setAuthToken"
import { setCurrentUser, logoutUser } from "./actions/authActions"
import PrivateRoute from "./components/private-route/PrivateRoute"

import Register from "./auth/Register"
import Login from "./auth/Login"
import Account from "./auth/Account"
import Dashboard from "./pages/Dashboard"
import Server from "./pages/Server"
import Clients from "./pages/Clients/Clients"
import AllClients from "./pages/Clients/AllClients"
import NewClient from "./pages/Clients/NewClient"
import Devices from "./pages/Devices"
import Actions from "./pages/Actions/Actions"
import AllActions from "./pages/Actions/AllActions"
import NewAction from "./pages/Actions/NewAction"
import Zones from "./pages/Zones"

// Check for token to keep user logged in
if (localStorage.jwtToken) {
  // Set auth token header auth
  const token = localStorage.jwtToken;
  setAuthToken(token);
  // Decode token and get user info and exp
  const decoded = jwt_decode(token);
  // Set user and isAuthenticated
  store.dispatch(setCurrentUser(decoded));
  // Check for expired token
  const currentTime = Date.now() / 1000; // to get in milliseconds
  if (decoded.exp < currentTime) {
    // Logout user
    store.dispatch(logoutUser());
    // Redirect to login
    window.location.href = "./login";
  }
}

export default class App extends Component {

  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <Account />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/server"
              element={
                <PrivateRoute>
                  <Server />
                </PrivateRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <PrivateRoute>
                  <Clients />
                </PrivateRoute>
              }>
              <Route
                index element={
                  <PrivateRoute>
                    <AllClients />
                  </PrivateRoute>
                }
              />
              <Route
                path="all_clients"
                element={
                  <PrivateRoute>
                    <AllClients />
                  </PrivateRoute>
                }
              />
              <Route
                path="new_client"
                element={
                  <PrivateRoute>
                    <NewClient />
                  </PrivateRoute>
                }
              />
            </Route>
            <Route
              path="/devices"
              element={
                <PrivateRoute>
                  <Devices />
                </PrivateRoute>
              }
            />
            <Route
              path="/actions"
              element={
                <PrivateRoute>
                  <Actions />
                </PrivateRoute>
              }>
              <Route
                index element={
                  <PrivateRoute>
                    <AllActions />
                  </PrivateRoute>
                }
              />
              <Route
                path="all_actions"
                element={
                  <PrivateRoute>
                    <AllActions />
                  </PrivateRoute>
                }
              />
              <Route
                path="new_action"
                element={
                  <PrivateRoute>
                    <NewAction />
                  </PrivateRoute>
                }
              />
            </Route>
            <Route
              path="/zones"
              element={
                <PrivateRoute>
                  <Zones />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </Provider>
    )
  }

}
