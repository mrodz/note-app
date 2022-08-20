export interface ThrottledCallback<T> {
	callback: (...args: T[]) => void,
	time: number,
}

/**
 * Usage in a React Component:
 * 
 * ```tsx
 * import { useRef } from 'react'
 * 
 * function Component() {
 * 	function cb(message: string) {
 *			console.log(message)
 * 	}
 * 
 * 	// returns a callback that can only execute once every 5,000 milliseconds
 * 	const buttonRef = useRef(new ThrottledCallback(cb, 5_000))
 * 
 * 	return (
 * 		<button onClick={buttonRef.current.call('Hello World!')}>
 * 			Click me
 * 		</button>
 * 	)
 * }
 * ```
 */
export class ThrottledCallback<T> {
	throttlePause = false

	constructor(callback: (...args: T[]) => void, time) {
		this.callback = callback
		this.time = time
	}

	call(...args: T[]) {
		if (this.throttlePause) return

		this.throttlePause = true
		this.callback(...args)

		setTimeout(() => {
			this.throttlePause = false
		}, this.time)
	}
}
