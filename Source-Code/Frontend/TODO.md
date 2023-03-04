# TODO

## Frontend

- [ ] `createStore` deprecated. Fix in `store.js`
- [x] replace former `componentWillReceiveProps` to handle errors in `Accounts.js`, `Login.js`, and `Register.js`
- [ ] improve error handling in `Accounts.js`, `Login.js`, and `Register.js` to prevent componentDidUpdate from re-rending twice when checking for changes in errors
- [x] update `Route`s in `App.js` to match react router dom 6
- [x] secure Dashboard route
- [x] logout method
- [x] fix how errors are displayed in `Account.js`
- [ ] refactor `Accounts.js`, `Login.js`, and `Register.js` for better reusability
- [x] hide errors on initial page load

## Backend

- [ ] verify that private backend routes cannot be used without authentication (currently require user id to use)
- [x] docker deployment
