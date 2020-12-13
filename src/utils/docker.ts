import { isEmpty } from 'lodash'
import { executeShellCommand } from './execute-shell-command'
import { sleep } from './sleep'
import {
	FailToBuildDockerImageError,
	FailToRunDockerContainerError,
} from '../errors'

// Teardown a exist docker container
export async function teardownDockerContainer(containerName: string) {
	try {
		await executeShellCommand(`docker kill ${containerName}`)
		return true
	} catch (e) {
		return false
	}
}

// Check if the docker image exists
export async function isImageExist(imageName:string, tag: string) {
	const existsImageName = await executeShellCommand(`docker images ${imageName} --format '{{.Tag}}'`)
	return existsImageName === tag
}

// Check if the docker container is running
export async function isDockerContainerRunning(imageName: string) {
	return !isEmpty(await executeShellCommand(`docker ps -f 'ancestor=${imageName}' --format '{{.Image}}'`))
}

// Build a new Docker image
export async function buildDockerImage(imageName: string, version: string, path: string) {
	await executeShellCommand(`docker build -t ${imageName} ${path}`)

	let tries = 0
	while (await isImageExist(imageName, version)) {
		// Wait up to 2 minutes
		if (tries++ === 12) throw new FailToBuildDockerImageError(`${imageName}`)
		await sleep(10000)
	}
}

// Run a Docker Container
export async function runDockerContainer(containerName: string, imageName: string, options: string) {
	await executeShellCommand(`docker run ${options} --name ${containerName} ${imageName}`)

	let tries = 0
	while (!(await isDockerContainerRunning(containerName))) {
		// Wait up to 30 seconds
		if (tries++ === 6) throw new FailToRunDockerContainerError(imageName)
		await sleep(5000)
	}
}
