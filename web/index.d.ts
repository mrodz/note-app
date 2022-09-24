declare module '*.svg'
declare module '*.png'
declare module '*.ts'

declare module Types {
	type User = {
		id: string
		username: string
		password: string
		createdAt: Date
		documents: Document[]
		guestDocuments: Document[]
		documentCount: number
	}

	type Document = {
		id: string
		title: string
		preview?: string
		content: string
		createdAt: Date
		lastUpdated: Date
		userId: string
		guests: User[]
		User: User
		privilege: number
	}

	type Session = {
		id: string
		userId: string
		activeSessions: number
	}
}

declare module 'ckeditor5-custom-build/build/ckeditor' {
	const Editor: any
	export = Editor
}