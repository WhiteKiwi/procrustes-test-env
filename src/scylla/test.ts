import setup from './setup'

async function test() {
	await setup()

	process.exit(0)
}
test()
