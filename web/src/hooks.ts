import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function useTimeout(callback: () => void, delay: number | null) {
	const savedCallback = useRef(callback)

	// Remember the latest callback if it changes.
	useIsomorphicLayoutEffect(() => {
		savedCallback.current = callback
	}, [callback])

	// Set up the timeout.
	useEffect(() => {
		// Don't schedule if no delay is specified.
		// Note: 0 is a valid value for delay.
		if (!delay && delay !== 0) {
			return
		}

		const id = setTimeout(() => savedCallback.current(), delay)

		return () => clearTimeout(id)
	}, [delay])
}

type CounterCallback = (difference?: number) => void
type UseCounterYield = [number, CounterCallback]

export function useCounter(initialValue: number): UseCounterYield {
	const [count, setCount] = useState(initialValue)

	const increment = (difference: number = 1) => setCount(count + difference)

	return [
		count,
		increment
	]
}

const initBeforeUnLoad = (showExitPrompt) => {
	window.onbeforeunload = (event) => {
		if (showExitPrompt) {
			const e = event || window.event
			e.preventDefault()
			if (e) {
				e.returnValue = ''
			}
			return ''
		}
	}
}

// Hook
export default function useExitPrompt(bool: boolean): [boolean, (arg0: boolean) => void] {
	const [showExitPrompt, setShowExitPrompt] = useState(bool)

	window.onload = function () {
		initBeforeUnLoad(showExitPrompt)
	}

	useEffect(() => {
		initBeforeUnLoad(showExitPrompt)
	}, [showExitPrompt])

	return [showExitPrompt, setShowExitPrompt]
}