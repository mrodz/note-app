import { Button, Card, createTheme, TextField, Typography, ThemeProvider } from "@mui/material";
import { useState } from "react";
import './Login.scss'


export const LoginTheme = createTheme({
	palette: {
		primary: {
			main: '#d68018'
		},
		secondary: {
			main: '#3b3740'
		}
	}
})

const sendLoginRequest = (username: string, password: string) => () => {
	console.log(username, password);

}

export default function Login() {
	const [username, setUsername] = useState<string>();
	const [password, setPassword] = useState<string>();

	return (
		<div className="Login-root">
			<div className="-super-Login-Card">
				<ThemeProvider theme={LoginTheme}>
					<Card className="Login-Card">
						<Typography variant="h4" color="primary">Sign In &mdash;</Typography>
						<form>
							<div className="Login-usernameform">
								<TextField label="Username" required color="secondary" onChange={e => setUsername(e.target.value)}></TextField>
							</div>
							<div className="Login-passwordform">
								<TextField label="Password" required type="password" color="secondary" onChange={e => setPassword(e.target.value)}></TextField>
							</div>
						</form>
						<div>
							<Button variant="contained" sx={{ width: '100%', marginBottom: '2rem' }} onClick={sendLoginRequest(username, password)}>
								Sign In
							</Button>
						</div>
						<hr />
						<div className="Login-noaccount">
							<Typography variant="subtitle1">Don't have an account?</Typography>
							<Button variant="outlined">Create one</Button>
						</div>
					</Card>
				</ThemeProvider>
			</div>
		</div >
	)
}