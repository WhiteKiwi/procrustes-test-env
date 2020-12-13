import { exec } from 'child_process'

export function executeShellCommand(command: string) {
	return new Promise((resolve) => {
		exec(command, (error, stdout, stderr) => {
			resolve((stdout || stderr).trim())
		})
	})
}
