let actions: {
	[id: number]: {
		name: string,
		code: () => void
	}
} = {}

let cKey = 0;

type AdminCodeCallback = (key: number, name: string, code?: () => void) => void

export function forEach(callback: AdminCodeCallback) {
	for (const key in actions) {
		const { name, code } = actions[key]
		callback(key as unknown as number, name, code)
	}
}

export function runScript(key: number) {
	return (actions[key]?.code as any ?? ((badAction) => {
		console.error(`${badAction} is not a key.`)
		return -1;
	}))(key) ?? 0
}

export function registerScript(name: string, code: () => void) {
	actions[cKey++] = {
		name: name,
		code: code
	}
}