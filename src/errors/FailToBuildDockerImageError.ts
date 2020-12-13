export default class FailToBuildDockerImageError extends Error {
	constructor(imageName: string) {
		const message = `Fail to build ${imageName}`
		super(message)
		this.name = 'FailToBuildDockerImageError'

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FailToBuildDockerImageError)
		}
	}
}
