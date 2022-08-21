import { Button, Card, TextField, Typography, FormControl, Chip, Tooltip, Divider } from "@mui/material";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useSnackbar } from "notistack";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { readFromLocalStorage } from "../AccountContext";
import { ThrottledCallback } from "../App";
import { areUsernameAndPasswordValid } from "../Register/Register";
import { motion } from 'framer-motion';
import './Login.scss'
import { Link } from "react-router-dom";

export async function _login(username, password) {
	if (!areUsernameAndPasswordValid(username, password)) return

	const response = await fetch('http://localhost:5000/api/login', {
		method: 'post',
		body: JSON.stringify({
			username: username,
			password: password
		}),
		headers: { 'Content-Type': 'application/json' }
	})

	if (response.status === 200) {
		const loginEvent = new CustomEvent('on:account-login', {
			detail: await response.json()
		})
		document.dispatchEvent(loginEvent)
	}
}

export default function Login() {
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const [count, setCount] = useState(1)

	let usernameRef = useRef(null),
		passwordRef = useRef(null);

	const { enqueueSnackbar, closeSnackbar } = useSnackbar();
	const navigate = useNavigate()

	const sendLoginRequest = async (_key: number, username: string, password: string) => {
		setLoading(true)
		setCount(count + 1)

		try {
			if (!areUsernameAndPasswordValid(username, password)) {
				enqueueSnackbar("Error! Wrong sign-in information.", {
					variant: 'error',
					persist: true,
					key: 'LOGIN_' + _key,
					action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGIN_' + _key) }}>{"×"}</Button>
				})

				return
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

			if (success) {
				const loginEvent = new CustomEvent('on:account-login', {
					detail: data
				})
				document.dispatchEvent(loginEvent)

				navigate('/dashboard', { replace: true })
				closeSnackbar()
			}

			enqueueSnackbar(success ? `Welcome, ${data?.username}` : data?.name ?? data?.title, {
				variant: success ? 'success' : 'error',
				persist: !success,
				key: 'LOGIN_' + _key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGIN_' + _key) }}>{"×"}</Button>
			})
		} finally {
			passwordRef.current.value = ""
			setPassword('')
			setLoading(false)
		}
	}

	const loginButton = useRef(new ThrottledCallback(sendLoginRequest, 5_000))

	return (
		<motion.div className="Login-root">
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
						onClick={() => loginButton.current.call(count, username, password)}>
						Sign In
					</Button>
					<Divider sx={{ marginBottom: '1.3rem' }}>

						<Typography variant="caption" mr=".5rem">Don&apos;t have an account?</Typography>
					</Divider>
					<div className="Login-signuppanel">
						<Tooltip title="Sign up today!" placement="bottom" arrow>
							<Link to="/register" style={{ textDecoration: 'none', margin: 'auto' }}>
								<Chip icon={<ArrowForwardIosIcon />} clickable label="Create One!" color="primary"></Chip>
							</Link>
						</Tooltip>
					</div>
				</Card>
			</div>
		</motion.div>
	)
}