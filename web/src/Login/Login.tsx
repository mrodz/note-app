import { Button, Card, createTheme, TextField, Typography, ThemeProvider, FormControl } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState, useRef, useContext } from "react";
import { readFromLocalStorage, writeToLocalStorage } from "../AccountContext";
import { areUsernameAndPasswordValid, throttle } from "../Register/Register";
import './Login.scss'

export default function Login() {
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const [count, setCount] = useState(1)

	let usernameRef = useRef(null),
		passwordRef = useRef(null);

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const sendLoginRequest = (_key: number, username: string, password: string) => async () => {
		setLoading(true)
		setCount(count + 1)

		try {
			if (!areUsernameAndPasswordValid(username, password)) {
				enqueueSnackbar("Error! Wrong sign-in information.", {
					variant: 'error',
					persist: true,
					key: 'LOGIN_' + _key,
					action: () => <Button color="secondary" onClick={() => { closeSnackbar(_key) }}>{"×"}</Button>
				})
			}

			const response = await fetch('http://localhost:5000/api/login', {
				method: 'post',
				body: JSON.stringify({
					username: username,
					password: password
				}),
				headers: { 'Content-Type': 'application/json' }
			})

			const data = await response.json()
			const success = response.status === 200

			// console.log(data);
			// writeToLocalStorage(data)

			if (success) {
				const loginEvent = new CustomEvent('on:account-login', {
					detail: data
				})
				document.dispatchEvent(loginEvent)

				// console.log('##', data)
				closeSnackbar()
			}
			enqueueSnackbar(success ? "Success!" : data?.name ?? data?.title, {
				variant: success ? 'success' : 'error',
				persist: !success,
				key: 'LOGIN_' + _key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(_key) }}>{"×"}</Button>
			})
		} finally {
			passwordRef.current.value = ""
			setPassword('')
			setLoading(false)
		}


	}

	return (
		<div className="Login-root">
			<div className="-super-Login-Card">
				<Card className="Login-Card">
					<Typography variant="h4" color="primary" mb="1rem">Sign In &mdash;</Typography>
					<FormControl sx={{ width: '100%' }}>
						<div className="Login-usernameform">
							<TextField label="Username" inputRef={usernameRef}
								helperText="Enter your username"
								color="secondary" onChange={_ => setUsername(usernameRef.current.value)}
							/>
						</div>
						<div className="Login-passwordform">
							<TextField label="Password" inputRef={passwordRef}
								helperText={"Enter your password"} type="password"
								color="secondary" onChange={_ => setPassword(passwordRef.current.value)}
							/>
						</div>
					</FormControl>
					<Button
						disabled={username === '' || password === ''}
						{...loading ? { loading: "true" } : {}} variant="contained" sx={{ width: '100%', marginBottom: '2rem' }}
						onClick={() => throttle(sendLoginRequest(count, username, password), 5_000)}>
						Sign In
					</Button>
				</Card>
			</div>
			{
				JSON.stringify(readFromLocalStorage())
			}
		</div>
	)
}