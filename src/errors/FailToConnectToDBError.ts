export default class FailToConnectToDBError extends Error {
	constructor(imageName: string) {
		const message = `Fail to connect to ${imageName}`
		super(message)
		this.name = 'FailToConnectToDBError'

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, FailToConnectToDBError)
		}
	}
}
