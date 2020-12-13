import { exec } from 'child_process'

export default (command: string): Promise<string> => {
	return new Promise((resolve) => {
		exec(command, (error, stdout, stderr) => {
			resolve((stdout || stderr).trim())
		})
	})
}
