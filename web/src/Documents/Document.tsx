import { Button, Typography } from "@mui/material"
import { useSnackbar } from "notistack"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Context } from "../AccountContext"
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import "./Document.scss"
import useExitPrompt, { useCounter, useTimeout } from "../hooks"
import { Link } from "react-router-dom"

function AccessDenied() {
	return (
		<div className="Document-AccessDenied">
			<DoNotTouchIcon sx={{ fontSize: '150pt' }} htmlColor="#abb0ac" />
			<Typography variant="h3">Whoops! Nothing to see here.</Typography>
			<Typography variant="h6">You lack access to this document.</Typography>
			<Typography variant="h6">
				<Link to="/dashboard" replace>
					Back to dashboard
				</Link>
			</Typography>
		</div>
	)
}

export default function UserDocument() {
	const user = useContext(Context)

	const [documentContent, setDocumentContent] = useState('')
	const [error, setError] = useState<any>({})
	const [throttlePause, setThrottlePause] = useState(false)

	const params = useParams()
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()
	const navigate = useNavigate()
	const [showExitPrompt, setShowExitPrompt] = useExitPrompt(false);

	const documentRef = useRef(null)

	useEffect(() => {
		if (!user?.sessionId) {
			navigate(`/login?next=/d/${params.id}`)
			return
		};

		(async () => {
			const response = await fetch('http://localhost:5000/api/load-doc', {
				method: 'post',
				body: JSON.stringify({
					documentId: params.id,
					sessionId: user.sessionId,
					userId: user.accountId,
				}),
				headers: { 'Content-Type': 'application/json' }
			})

			const data = await response.json()
			const success = response.status === 200

			closeSnackbar()
			const key = 'DOCUMENT_' + Math.random()
			enqueueSnackbar(success ? `Editing '${data.title}'` : `Error: ${data.name}`, {
				variant: success ? 'success' : 'error',
				persist: !success,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})

			if (success) {
				setDocumentContent(data.content)
			} else {
				setError(data)
			}
		})()
	}, [closeSnackbar, enqueueSnackbar, user?.accountId, user?.sessionId, params?.id])

	const timeoutRef = useRef(null);

	useEffect(() => {
		return () => {
			clearTimeout(timeoutRef.current)
			setShowExitPrompt(false)
		}
	}, [])

	useEffect(() => {
		return () => {
			if (documentRef.current?.value !== undefined) {
				documentChange()
			}

			// clearTimeout(timeoutRef.current)
		}
	}, [documentRef.current?.value, timeoutRef.current])

	const l = (a) => {
		return a
	}

	const test = useRef(0);

	const documentChange = useCallback(async () => {
		const response = await fetch('http://localhost:5000/api/write-doc', {
			method: 'post',
			body: JSON.stringify({
				documentId: params.id,
				sessionId: user.sessionId,
				userId: user.accountId,
				newContent: documentRef.current?.value
			}),
			headers: { 'Content-Type': 'application/json' }
		})
		const success = response.status === 200

		if (!success) {
			const key = 'DOCUMENT_' + Math.random()
			enqueueSnackbar('Could not sync your data', {
				variant: 'error',
				persist: true,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})
		}
	}, [])

	const documentChangeThrottle = useCallback(async function (cb: (() => void | Promise<void>) = documentChange) {
		const waiting = throttlePause

		test.current += 1

		setThrottlePause(true)
		if (waiting) return

		cb()

		timeoutRef.current = setTimeout(() => {
			if (test.current > 1) cb()
			test.current = 0
			setThrottlePause(false)
		}, 10_000)
	}, [documentChange, throttlePause])

	return (
		<>
			{user?.sessionId ? (
				<>{
					!('name' in error) ? (
						<div className="Document">

							<div className="Document-tray">
								<div>
									Tray
								</div>
								<textarea ref={documentRef} className="Document-textarea" placeholder="Empty document" defaultValue={documentContent} onBlur={async () => await documentChange()} onChange={async () => await documentChangeThrottle()} />
							</div>
						</div>
					) : <AccessDenied />
				}</>
			) : "Please sign in."}
		</>
	)
}