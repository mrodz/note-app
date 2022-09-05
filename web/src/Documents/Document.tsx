import { Button, Divider, IconButton, ListItemIcon, MenuItem, MenuList, Typography } from "@mui/material"
import { useSnackbar } from "notistack"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Context } from "../AccountContext"
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import Editor from 'ckeditor5-custom-build/build/ckeditor';

import "./Document.scss"
import useExitPrompt from "../hooks"
import { Link } from "react-router-dom"
import { memo } from "react"
import { formatDate } from "../Dashboard/Dashboard"

const AccessDenied = memo(() => {
	useEffect(() => {
		document.title = 'Access Denied'
	}, [])
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
})

export default function UserDocument() {
	const user = useContext(Context)

	const [document, setDocument] = useState<any>({})
	const [error, setError] = useState<any>({})
	const [throttlePause, setThrottlePause] = useState(false)
	const [lastSave, setLastSave] = useState(new Date())
	const [prevSave, setPrevSave] = useState(null);

	const params = useParams()
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()
	const navigate = useNavigate()

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
				setDocument(data)
				setLastSave(new Date(data.lastUpdated));
				globalThis.document.title = `Editing '${data.title}'`
			} else {
				setError(data)
			}
		})()
	}, [closeSnackbar, enqueueSnackbar, user?.accountId, user?.sessionId, params?.id])

	const timeoutRef = useRef(null);

	useEffect(() => {
		return () => {
			clearTimeout(timeoutRef.current)
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
		if (prevSave === documentRef.current.getData()) {
			setLastSave(new Date())
			console.log(`fake save [${prevSave}], [${documentRef.current.getData()}]`);

			return // don't actually save anything if it is a duplicate.
		}

		const response = await fetch('http://localhost:5000/api/write-doc', {
			method: 'post',
			body: JSON.stringify({
				documentId: params.id,
				sessionId: user.sessionId,
				userId: user.accountId,
				newContent: documentRef.current.getData()
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
		} else {
			setLastSave(new Date())
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
								<div className="Document-tray-main">
									<Typography mb="1rem" variant="h4" className="Document-tray-header">
										{document?.title} - Saved {formatDate(lastSave, true)}
									</Typography>
									<div id="editor"></div>
									<CKEditor
										editor={Editor}
										data={document?.content}
										onBlur={async () => await documentChange()}
										onChange={async () => {
											await documentChangeThrottle()
										}}
										onReady={editor => {
											documentRef.current = editor
										}}
									/>
								</div>
							</div>
						</div>
					) : <AccessDenied />
				}</>
			) : "Please sign in."}
		</>
	)
}