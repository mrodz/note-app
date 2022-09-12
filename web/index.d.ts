declare module '*.svg'
declare module '*.png'
declare module '*.ts'

declare module 'ckeditor5-custom-build/build/ckeditor' {
	const Editor: any
	export = Editor
}