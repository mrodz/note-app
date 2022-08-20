import React, { useContext, useRef } from 'react'
import { useSnackbar } from 'notistack';
import { Button } from '@mui/material';
import { Context } from '../AccountContext';
import { ThrottledCallback } from '.';

export default function LogoutButton() {
	const [loading, setLoading] = React.useState(false);
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const [count, setCount] = React.useState(1)

	const user = useContext(Context)

	async function logoutUser(_key: number) {
		setLoading(true)
		setCount(count + 1)

		try {
			const accountId = user.accountId

			const response = await fetch('http://localhost:5000/api/logout', {
				method: 'post',
				body: JSON.stringify({
					userId: accountId
				}),
				headers: { 'Content-Type': 'application/json' }
			})

			const data = await response.json()
			const success = response.status === 200

			document.dispatchEvent(new Event('on:account-logout'))

			if (success) {
				closeSnackbar()
			}

			enqueueSnackbar(success ? `Logged out from ${user.username}` : data.name, {
				variant: success ? 'success' : 'error',
				persist: !success,
				key: 'LOGOUT_BUTTON_' + _key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGOUT_BUTTON_' + _key) }}>{"×"}</Button>
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