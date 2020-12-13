import _FailToBuildDockerImageError from './FailToBuildDockerImageError'
import _FailToRunDockerContainerError from './FailToRunDockerContainerError'
import _FailToConnectToDBError from './FailToConnectToDBError'

export const FailToBuildDockerImageError = _FailToBuildDockerImageError
export const FailToRunDockerContainerError = _FailToRunDockerContainerError
export const FailToConnectToDBError = _FailToConnectToDBError

export default {
	FailToBuildDockerImageError,
	FailToRunDockerContainerError,
	FailToConnectToDBError,
}
