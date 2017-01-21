<!-- Vanity header for GitHub, forgive me. -->
<p align="center">
  <a href="https://millwrightjs.com">
    <img
      width="300px"
      src="https://raw.githubusercontent.com/millwrightjs/millwright/master/logo.png">
  </a>
</p>
<p align="center">
  <strong>A zero configuration build tool for the web.</strong>
</p>
<hr>
<p align="center">
  <a href="https://travis-ci.org/millwrightjs/millwright">
    <img src="https://travis-ci.org/millwrightjs/millwright.svg?branch=master" alt="Build Status">
  </a>
</p>
<hr>

## Intro
Millwright provides the common build functionality that many projects need without requiring any
setup.

Please visit [millwrightjs.com](https://millwrightjs.com) for more information, including usage and
installation.

## Project status
Millwright is currently in Alpha. That means that the basic feature set expected for the 1.0.0
milestone is in place, and that it's generally expected to work as described. Alpha status also
means that the library is highly untested, and that the project is ready for developer usage and
contributions via issues and PR's.

Current priorites include:

* Windows support (look for that Appveyor badge soon)
* Refactoring
* Error messaging
* Input validation
* Testing, testing, and more testing

## Issues
We'll take any and all issue reports, we just ask that any helpful info be provided, such as
environment details and any stack traces or error messages.

## Pull Requests
This project does not yet have a formal styleguide. For now, the following considerations should be
observed when submitting code:

* Communicate via issues and get confirmation before doing anything big
* Style matters - keep it clean:q
* Add or update relevant tests (currently happening in [e2e](https://github.com/millwrightjs/millwright/tree/master/e2e)).

## Support
Join the [Gitter chat](https://gitter.im/millwrightjs/millwright) to get (or give) realtime help
from the community.

## Building Locally
The following commands are available for building Millwright locally:

* `npm run build` - runs the build
* `npm run watch` - runs the build, then watches for changes