# AoM IoT Web App

Web app using MERN stack and JWT authentication that allows users to control their IoT Bits over the Internet

Based on the `auth-template` project found [here](https://github.com/delta-12/auth-template)

## Overview

Users can create an account with a unique email and a password, then start their own MQTT server for their IoT Bits to connect to. Users can add, modify, and monitor their IoT Bits and other devices as well as define custom actions that can be triggered by a particular device.

## Prerequisites

1. Node.js and npm

   See [https://docs.npmjs.com/downloading-and-installing-node-js-and-npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for installation instructions

### Development

Run the following commands to start the development environment.

1. `npm run backend-install`
2. `npm run build-style`
3. `export MONGOURI="<your MongoDB URI>"`
4. (Optional) Update `endpoints.js` to point to your development infrastructure such as an MQTT development server for testing or a development deployment of the `mqtt-client-auth` backend service which can be run in conjunction for greater development functionality
5. `npm run dev`
