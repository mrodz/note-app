import { Button, Card, createTheme, TextField, Typography, ThemeProvider, FormControl } from "@mui/material";
import { useSnackbar } from "notistack";
import { useState, useRef } from "react";
import { areUsernameAndPasswordValid, throttle } from "../Register/Register";
import './Login.scss'


// export const LoginTheme = createTheme({
// 	palette: {
// 		primary: {
// 			main: '#d68018'
// 		},
// 		secondary: {
// 			main: '#3b3740'
// 		}
// 	}
// })

export default function Login() {
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const [count, setCount] = useState(1)

	let usernameRef = useRef(null),
		passwordRef = useRef(null);

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	const sendLoginRequest = (_key: number, username: string, password: string) => () => {
		if (!areUsernameAndPasswordValid(username, password)) {
			enqueueSnackbar("Error! Wrong sign-in information.", {
				variant: 'error',
				persist: true,
				key: _key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(_key) }}>{"×"}</Button>

			})
		}

		console.log(username, password);
		setCount(count + 1)
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
						{...loading ? { loading } : {}} variant="contained" sx={{ width: '100%', marginBottom: '2rem' }}
						onClick={() => throttle(sendLoginRequest(count, username, password), 5_000)}>
						Sign Up
					</Button>
				</Card>
			</div>
		</div>
	)
}