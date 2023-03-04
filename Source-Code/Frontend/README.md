# auth-template

Template for web app using MERN stack and JWT authentication

## Usage

### Development

Run the following commands to start the development environment.

1. `cd frontend && npm install .`
2. `cd ../backend && npm install .`
3. `export MONGOURI="<your MongoDB URI>"`
4. `npm run dev`

### Production

You can use the included Docker environment to deploy for production. Install `docker` and `docker-compose`, then run the following commands.

1. `cd docker`
2. `export MONGOURI="<your MongoDB URI>"`
3. `docker-compose build && docker-compose up`
