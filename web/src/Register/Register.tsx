import { Card, TextField, Typography, ThemeProvider, FormControl, Tooltip } from "@mui/material";
import { LoadingButton as Button } from "@mui/lab"
import { useRef, useState } from "react";
import { useSnackbar } from "notistack"
import fetch from "node-fetch"
import { ThrottledCallback } from "../App";

type SetStateFunction<T> = React.Dispatch<React.SetStateAction<T>>

const onType = (e: string, setState: SetStateFunction<[string, number]>, check: () => number) => {
	setState([e, check()])
}

const USERNAME_MESSAGES = {
	[-1]: "Enter a username (Alphanumeric Characters, '.', '_')",
	0: "Looks good so far!",
	1: "Bad length! Must be between 3-16 characters",
	2: "Username can only contain numbers, letters, '_', and '.'",
	3: 'Username already exists'
}

const PASSWORD_MESSAGES = {
	[-1]: "Enter a password (Alphanumeric Characters and ~`!@#$%^&*()_-+={[}]|:;\"'<,>.?/)",
	0: "Looks good so far!",
	1: "Bad length! Must be between 6-127 characters",
	2: "Passwords must consist of 0-9, a-Z, or the following: ~`!@#$%^&*()_-+={[}]|:;\"'<,>.?/"
}

const PASSWORD_CONFIRM_MESSAGES = {
	[-1]: "Re-enter your password",
	0: "It's a match!",
	1: "Passwords do not match",
}

function validUsernameLength(username: string) {
	return username.length >= 3 && username.length <= 16
}

function validUsernameChars(username: string) {
	return /^[a-zA-Z0-9._]+$/.test(username)
}

function validPasswordLength(password: string) {
	return password.length > 5 && password.length < 128
}

function validPasswordChars(password: string) {
	return /^[a-zA-Z0-9~`!@#$%^&*()_\\+={[}\]|:;"'<,>.?/-]+$/.test(password)
}

export function areUsernameAndPasswordValid(username, password) {
	return validUsernameLength(username)
		&& validUsernameChars(username)
		&& validPasswordLength(password)
		&& validPasswordChars(password)

}

function isFormValid(username, password, passwordConfirm) {
	return areUsernameAndPasswordValid(username, password) && password === passwordConfirm
}

export default function Login() {
	const [username, setUsername] = useState<[string, keyof typeof USERNAME_MESSAGES]>(['', -1]);
	const [password, setPassword] = useState<[string, keyof typeof PASSWORD_MESSAGES]>(['', -1]);
	const [passwordConfirm, setPasswordConfirm] = useState<[string, keyof typeof PASSWORD_CONFIRM_MESSAGES]>(['', -1]);
	const [loading, setLoading] = useState<boolean>(false);
	const [count, setCount] = useState(1)
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const a = username[0], b = password[0], c = passwordConfirm[0];

	let usernameRef = useRef(null),
		passwordRef = useRef(null),
		passwordConfirmRef = useRef(null);

	const sendRegisterRequest = async (_key: number, username: string, password: string, passwordConfirm: string) => {
		setLoading(true)
		setCount(count + 1)

		try {
			const response = await fetch('http://localhost:5000/api/register', {
				method: 'post',
				body: JSON.stringify({
					username: username,
					password: password
				}),
				headers: { 'Content-Type': 'application/json' }
			})

			const data = await response.json();
			const success = response.status === 200;

			if (success)
				closeSnackbar()
			else if (/^Name Taken/.test(data.name))
				setUsername([username, 3])

			enqueueSnackbar(success ? "Success!" : data.name, {
				variant: success ? 'success' : 'error',
				persist: !success,
				key: 'REGISTER_' + _key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar('REGISTER_' + _key) }}>{"×"}</Button>

			})

			return data
		} finally {
			passwordRef.current.value = ''
			passwordConfirmRef.current.value = ''
			setPassword(['', -1])
			setPasswordConfirm(['', -1])

			setLoading(false)
		}
	}

	const registerCallback = useRef(new ThrottledCallback(sendRegisterRequest, 5_000))

	return (
		<div className="Login-root">
			<div className="-super-Login-Card">
				<Card className="Login-Card">
					<Typography variant="h4" color="primary" mb="1rem">Sign Up &mdash;</Typography>
					<FormControl sx={{ width: '100%' }}>
						<div className="Login-usernameform">
							<TextField error={username[1] > 0} label="Username" inputRef={usernameRef}
								helperText={USERNAME_MESSAGES[username[1]]}
								color="secondary" onChange={_ => onType(usernameRef.current.value, setUsername, () => {
									let _username = usernameRef.current.value;

									if (!validUsernameLength(_username)) return 1
									if (!validUsernameChars(_username)) return 2
									return 0
								})}
							/>
						</div>
						<div className="Login-passwordform">
							<TextField error={password[1] > 0} label="Password" inputRef={passwordRef}
								helperText={PASSWORD_MESSAGES[password[1]]} type="password"
								color="secondary" onChange={_ => onType(passwordRef.current.value, setPassword, () => {
									let _password = passwordRef.current.value;

									if (!validPasswordLength(_password)) return 1
									if (!validPasswordChars(_password)) return 2
									return 0
								})}
							/>
						</div>
						<div className="Login-passwordform">
							<TextField error={passwordConfirm[1] > 0} label="Confirm Password" inputRef={passwordConfirmRef}
								helperText={PASSWORD_CONFIRM_MESSAGES[passwordConfirm[1]]} type="password"

								color="secondary" onChange={_ => onType(passwordConfirmRef.current.value, setPasswordConfirm, () => {
									return passwordRef.current.value === passwordConfirmRef.current.value && passwordConfirmRef.current.value !== '' ? 0 : 1
								})}
							/>
						</div>
					</FormControl>
					<Tooltip title={registerCallback.current.throttlePause ? "Please wait before trying this again." : "Register!"}>
						<span>
							<Button disabled={!isFormValid(a, b, c)} {...loading ? { loading } : {}} variant="contained" sx={{ width: '100%', marginBottom: '2rem' }} onClick={() => registerCallback.current.call(count, a, b, c)}>
								Sign Up
							</Button>
						</span>
					</Tooltip>
				</Card>
			</div>
		</div>
	)
}