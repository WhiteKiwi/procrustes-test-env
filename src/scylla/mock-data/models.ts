interface UserSessionConstrunctorParams {
	uuid: string
	accessToken: string
	refreshToken: string
}

export class UserSession {
	uuid: string
	accessToken: string
	refreshToken: string
	
	constructor({ uuid, accessToken, refreshToken }: UserSessionConstrunctorParams) {
		this.uuid = uuid
		this.accessToken = accessToken
		this.refreshToken = refreshToken
	}
}

export default {
	UserSession,
}
