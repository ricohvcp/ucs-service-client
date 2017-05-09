# CHANGELOG

## [1.0.3](https://github.com/ricohvcp/vcp-service-client/releases/tag/v1.0.3)

- support HTTP response without Content-Type header (Such as result of DELETE)
- remove hard coded cids, and modify config template

## [1.0.2](https://github.com/ricohvcp/vcp-service-client/releases/tag/v1.0.2)

- support multiple scope in discovery
- return multiple error from fetch as FetchErrors

## [1.0.1](https://github.com/ricohvcp/vcp-service-client/releases/tag/v1.0.1)

- support [Bluebird new cancellation design](http://bluebirdjs.com/docs/api/cancellation.html) (this blocks release of v1.0.0)
- update dependencies

## [0.0.13](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.13)

- support roster
 - getRoster()
 - addRoster()
 - updateRoster()
 - deleteRoster()

## [0.0.12](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.12)

- [**breakin changes**] remove `logUploadCancel()`
- all API return cancelable promise
- VCPClient is not event emitter now
- reject promise with Array of FetchError if multiple error was responed

## [0.0.11](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.11)

- update validation logics

## 0.0.8-0.0.10

- bugfix

## [0.0.7](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.7)

- support proxy using vcp-service-client-proxy

## [0.0.6](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.6)

- update superagent to v1.1.0

## [0.0.5](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.5)

- fix for linux error handling
- publish with build result


## [0.0.3](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.3)

rename Session class to VCPClient

## [0.0.2](https://github.com/ricohvcp/vcp-service-client/releases/tag/v0.0.2)

change module name to ucs-service-client to vcp-service-client


## [0.0.0](https://github.com/ricohvcp/ucs-service-client/releases/tag/v0.0.0)

Initial Release
