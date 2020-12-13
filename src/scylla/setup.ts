import { isEmpty } from 'lodash'
import fs from 'fs'
import { Client } from 'cassandra-driver'
import { sleep, executeShellCommand } from '../utils'
import {
	FailToBuildDockerImageError,
	FailToRunDockerContainerError,
	FailToConnectToDBError,
} from '../errors'
import { END_POINTS, DATA_CENTER } from './test-env'

import packageInfo from '../../package.json'
const version = packageInfo['scylla-version']

// Check if the docker image exists
async function isImageExist(version: string) {
	const existsImageName = await executeShellCommand(`docker images procrustes-scylla:${version} --format '{{.Tag}}'`)
	return existsImageName === version
}

// Teardown exist docker containers
async function teardownDockerContainer(version: string) {
	try {
		await executeShellCommand('docker kill procrustes-scylla-test')
		console.log('Tear down the exist db')
	} catch (e) {}
}

// Build a new Docker image
async function buildDockerImage(version: string, path: string) {
	await teardownDockerContainer(version)

	await executeShellCommand(`docker build -t procrustes-scylla:${version} ${path}`)

	let tries = 0
	while (await isImageExist(version)) {
		// Wait up to 30 seconds
		if (tries++ === 6) throw new FailToRunDockerContainerError(`procrustes-scylla:${version}`)
		await sleep(5000)
	}
}

// Check if the docker container is running
async function isDockerContainerRunning(version: string) {
	return !isEmpty(await executeShellCommand(`docker ps -f 'ancestor=procrustes-scylla:${version}' --format '{{.Image}}'`))
}

// Run a Docker Container
async function runDockerContainer(version: string) {
	await executeShellCommand(`docker run -d --rm -p 9042:9042 --name procrustes-scylla-test procrustes-scylla:${version}`)

	let tries = 0
	while (await isDockerContainerRunning(version)) {
		// Wait up to 30 seconds
		if (tries++ === 6) throw new FailToBuildDockerImageError(`procrustes-scylla:${version}`)
		await sleep(5000)
	}
}

// Wait for db to be ready
async function connectToDB(client: Client) {
	let tries = 0
	while (true) {
		try {
			await client.connect()
			break
		} catch (e) {
			// Wait up to 30 seconds
			if (tries++ === 6) throw new FailToConnectToDBError(`procrustes-scylla:${version}`)
			await sleep(5000)
		}
	}
}

// Load the CQL file
async function loadQueriesFromCQLFile(path: string) {
	const cql = await fs.readFileSync(path, 'utf8')

	return cql.trim().split(';')
		.filter((query) => !isEmpty(query.trim()))
		.map((query) => query.trim() + ';')
}

// Schema Setting on db
async function setSchemaToDB() {
	const client = new Client({
		contactPoints: END_POINTS,
		localDataCenter: DATA_CENTER,
	})
    
	await connectToDB(client)
    
	// execute cql
	const queries = await loadQueriesFromCQLFile('./node_modules/mock-data/scylla/schema-dump.cql')
	for (const query of queries) {
		await client.execute(query)
	}
}

export default async () => {
	if (!(await isImageExist(version))) {
		console.log('Docker image is not the latest version')
		console.log('Start to build new image...')
		await buildDockerImage(version, './node_modules/procrustest-test-env/src/scylla/docker/')
	}
    
	if (!(await isDockerContainerRunning(version))) {
		console.log('There are no docker container.')
		console.log('Run a new container...')
		await runDockerContainer(version)
        
		console.log('Set up the schema to DB')
		await setSchemaToDB()
	}
}
