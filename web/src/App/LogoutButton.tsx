import React, { useContext, useRef } from 'react'
import { Button } from '@mui/material'
import { Context } from '../AccountContext'
import { ThrottledCallback } from '.'
import { clearNotifications, post, pushNotification } from './App'

export default function LogoutButton() {
	const [loading, setLoading] = React.useState(false)
	const [count, setCount] = React.useState(1)

	const user = useContext(Context)

	async function logoutUser(_key: number) {
		setLoading(true)
		setCount(count + 1)

		try {
			const accountId = user.accountId

			const result = await post.to('/logout').send({
				userId: accountId
			}, ['ok'])

			document.dispatchEvent(new Event('on:account-logout'))

			if (result.ok) {
				clearNotifications()
			}

			pushNotification(result.ok ? `Logged out from ${user.username}` : result.json?.name, {
				variant: result.ok ? 'success' : 'error',
				persist: !result.ok,
			})
		} finally {
			setLoading(false)
		}
	}

	const logoutButton = useRef(new ThrottledCallback(logoutUser, 5_000))

	return (
		<Button
			disabled={!user?.sessionId}
			{...loading ? { loading: "true" } : {}} variant="contained"
			onClick={() => logoutButton.current.call(count)}>
			Log Out
		</Button>
	)
}