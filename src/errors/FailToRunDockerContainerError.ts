export default class FailToRunDockerContainerError extends Error {
	constructor(imageName: string) {
		const message = `Fail to run ${imageName}`
		super(message)
		this.name = 'FailToRunDockerContainerError'

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FailToRunDockerContainerError)
		}
	}
}
