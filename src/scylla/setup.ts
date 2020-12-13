import { isEmpty } from 'lodash'
import fs from 'fs'
import path from 'path'
import {
	sleep,
	isImageExist,
	isDockerContainerRunning,
	teardownDockerContainer,
	buildDockerImage,
	runDockerContainer,
} from '../utils'
import { FailToConnectToDBError } from '../errors'

import { Client, mapping, auth } from 'cassandra-driver'
import SCYLLA from './test-env'
import mockData from './mock-data'
import { UserSession } from './mock-data/models'

import packageInfo from '../../package.json'
const version = packageInfo['scylla-version']
const IMAGE_NAME = `procrustes-scylla:${version}`
const CONTAINER_NAME = 'procrustes-scylla-test'

// Wait for db to be ready
async function connectToDB(client: Client) {
	let tries = 0
	while (true) {
		try {
			await client.connect()
			break
		} catch (e) {
			// Wait up to 60 seconds
			if (tries++ === 12) throw new FailToConnectToDBError(IMAGE_NAME)
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
		contactPoints: SCYLLA.END_POINTS,
		localDataCenter: SCYLLA.DATA_CENTER,
		authProvider: new auth.PlainTextAuthProvider(
			SCYLLA.USER_NAME,
			SCYLLA.PASSWORD,
		),
	})
    
	await connectToDB(client)
    
	// execute cql
	const queries = await loadQueriesFromCQLFile(path.join(__dirname, 'schema-dump.cql'))
	for (const query of queries) {
		await client.execute(query)
	}

	await client.shutdown()
}

// Drop keyspace
async function dropKeySpace(keyspace: string) {
	const client = new Client({
		contactPoints: SCYLLA.END_POINTS,
		localDataCenter: SCYLLA.DATA_CENTER,
		authProvider: new auth.PlainTextAuthProvider(
			SCYLLA.USER_NAME,
			SCYLLA.PASSWORD,
		),
	})

	try {
		await client.execute(`DROP KEYSPACE ${keyspace};`)
	} catch (e) {}

	await client.shutdown()
}

// create user_sessions
async function createUserSessions(client: Client, userSessions: UserSession[]) {
	const mappingOptions: mapping.MappingOptions = {
		models: {
			UserSession: {
				tables: ['user_sessions'],
				mappings: new mapping.UnderscoreCqlToCamelCaseMappings(),
			},
		},
	}
	const userSessionMapper = new mapping.Mapper(client, mappingOptions).forModel('UserSession')

	for (const userSession of userSessions) {
		await userSessionMapper.insert(userSession)
	}
}

// inject mock data to DB
async function injectMockDataToDB(mockData: any) {
	const client = new Client({
		contactPoints: SCYLLA.END_POINTS,
		localDataCenter: SCYLLA.DATA_CENTER,
		keyspace: SCYLLA.KEYSPACE,
		authProvider: new auth.PlainTextAuthProvider(
			SCYLLA.USER_NAME,
			SCYLLA.PASSWORD,
		),
	})

	await createUserSessions(client, mockData.userSessions)

	await client.shutdown()
}

export default async () => {
	if (!(await isImageExist(IMAGE_NAME, version))) {
		const isTeardowned = await teardownDockerContainer(CONTAINER_NAME)
		if (isTeardowned) console.log('Tear down the exist container')

		console.log('Docker image is not the latest version')
		console.log('Start to build new image...')
		await buildDockerImage(IMAGE_NAME, version, path.join(__dirname, 'docker/'))
	}

	if (await isDockerContainerRunning(IMAGE_NAME)) {
		console.log('Docker container is already running')
		console.log('Drop keyspace...')
		await dropKeySpace(SCYLLA.KEYSPACE)
	} else {
		console.log('There is no docker container')
		console.log('Run a new container...')
		await runDockerContainer(CONTAINER_NAME, IMAGE_NAME, '-d --rm -p 9042:9042')
	}
        
	console.log('Set up the schema to DB...')
	await setSchemaToDB()

	console.log('Inject mock data to DB...')
	await injectMockDataToDB(mockData)
    
	console.log('Setup complete!')
}
