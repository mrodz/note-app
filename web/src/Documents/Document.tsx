import { Button, Divider, Typography } from "@mui/material"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Context } from "../AccountContext"
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import Editor from 'ckeditor5-custom-build/build/ckeditor';

import "./Document.scss"
import { Link } from "react-router-dom"
import { memo } from "react"
import { formatDate } from "../Dashboard/Dashboard"
import { post, pushNotification } from "../App/App"
import { ArrowBackIosNew } from "@mui/icons-material"

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

	const params = useParams()
	const navigate = useNavigate()

	const documentRef = useRef(null)

	useEffect(() => {
		if (!user?.sessionId) {
			navigate(`/login?next=/d/${params.id}`)
			return
		};

		(async () => {
			const result = await post.to('/load-doc').send({
				documentId: params.id,
				sessionId: user.sessionId,
				userId: user.accountId,
			})

			if (result.ok) {
				setDocument(result.json)
				setLastSave(new Date(result.json.lastUpdated));
				globalThis.document.title = `Editing '${result.json.title}'`
			} else {
				setError(result.json)
			}
		})()
	}, [user?.accountId, user?.sessionId, params?.id, navigate])

	const timeoutRef = useRef(null);

	useEffect(() => {
		return () => {
			clearTimeout(timeoutRef.current)
		}
	}, [])


	const documentChange = useCallback(async () => {
		const result = await post.to('/write-doc').send({
			documentId: params.id,
			sessionId: user.sessionId,
			userId: user.accountId,
			newContent: documentRef.current.getData()
		}, ['ok'])

		if (!result.ok) {
			pushNotification('Could not sync your data', {
				variant: 'error',
				persist: true
			})
		} else {
			setLastSave(new Date())
		}
	}, [params.id, user.accountId, user.sessionId])

	useEffect(() => {
		return () => {
			if (documentRef.current?.value !== undefined) {
				documentChange()
			}

			// clearTimeout(timeoutRef.current)
		}
	}, [documentRef.current?.value, documentChange])

	const test = useRef(0);

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

	function dashboardClick() {
		navigate('/dashboard');
	}

	return (
		<>
			{user?.sessionId ? (
				<>{
					!('name' in error) ? (
						<div className="Document">
							<div className="Document-tray">
								<div className="Document-tray-main">
									<Typography mb="1rem" variant="h4" className="Document-tray-header">
										<Button variant="outlined" onClick={dashboardClick}>
											<ArrowBackIosNew sx={{ marginRight: '1rem' }} /> DASHBOARD
										</Button>
										<span>Document Saved @ {formatDate(lastSave, true)}</span>
										<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }} />
										{document?.title}
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