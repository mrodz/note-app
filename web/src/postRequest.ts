interface PostConfig {
	baseURL: string,
	interceptor: (request: any, response: Response) => void,
}

export default class Post {
	config: PostConfig

	constructor(config) {
		this.config = config
	}

	static config(data): Post {
		return new Post(data)
	}

	to(string): PostRequestSender {
		return new PostRequestSender(string, this.config)
	}

	static to(string): PostRequestSender {
		return new PostRequestSender(string)
	}
}

type PostResponse<R = any> = {
	json?: R,
	code?: number,
	ok?: boolean
}

type SendSettingsOptions = 'json' | 'code' | 'ok'
type SendSettings = SendSettingsOptions[]

class PostRequestSender<T = any> {
	config: PostConfig
	to: string

	constructor(to: string, config?: PostConfig) {
		this.to = to
		this.config = config
	}

	async send<R = any>(data: T, get: SendSettings = ['json', 'code', 'ok']): Promise<PostResponse<R>> {
		let response = await fetch((this.config?.baseURL ?? '') + this.to, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' }
		})

		const json = await response.json()
		this.config?.interceptor?.(data, json)
		// response = this.config?.interceptor?.(response) ?? response
		if (!response.ok) console.trace(response.status, data, response)

		let result = {};

		for (let setting of get) {
			switch (setting) {
				case 'json':
					result = { ...result, json: json as R }
					break
				case 'code':
					result = { ...result, code: response.status }
					break
				case 'ok':
					result = { ...result, ok: response.status === 200 }
					break
			}
		}

		return result
	}
}