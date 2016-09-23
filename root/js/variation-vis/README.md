# Variation Viewer

## Overview
The variation viewer makes it easier to compare variations across protein homologs and infer phenotypes and diseases based on homology.

__[Try it here](http://dev.wormbase.org:9015)__

## To contribute
### Setup Dev Environment

Ensure the following are installed before preceeding:
- Node.js (v6.x.x)
- npm (v3.x.x)

__Note: all `npm` commands below needs to be done at the root directory of the project, where `package.json` is located.__

Install dependencies:

`npm install`

### Development and Testing
To run the development server with hot reloading (by default it starts on http://localhost:9004):

`npm run start`

To build static assets (the built assets can be found in `build/` directory):

`npm run build`

To test serving the static assets in the `build/`:

`cp index.html build/`

`npm run serve-build -- --port PORT_NUMBER`
