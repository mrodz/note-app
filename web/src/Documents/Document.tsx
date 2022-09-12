import { Button, Dialog, DialogActions, DialogContentText, DialogTitle, Divider, TextField, Typography } from "@mui/material"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Context } from "../AccountContext"
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import Editor from 'ckeditor5-custom-build/build/ckeditor'

import "./Document.scss"
import { Link } from "react-router-dom"
import { memo } from "react"
import { formatDate, Transition } from "../Dashboard/Dashboard"
import { post, pushNotification } from "../App/App"
import { ArrowBackIosNew, Share } from "@mui/icons-material"
import { AnimatePresence, motion } from "framer-motion"
import ShareButton from "./ShareButton"
import { isUsernameValid } from "../Register/Register"

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
	const [shareModalOpen, setShareModalOpen] = useState(false)


	const params = useParams()
	const navigate = useNavigate()

	const documentRef = useRef(null)

	const requirePrivilege = (privilegeLevel: number, cb: (...args: any[]) => any, not?: (...args: any) => any) => {
		if (document?.privilege >= privilegeLevel) return cb
		return not ?? (() => { })
	}

	const getActionVerb = requirePrivilege(2, () => "Editing", () => "Viewing")

	const loadDoc = async () => {
		return await post.to('/doc/get').send({
			documentId: params.id,
			sessionId: user.sessionId,
			userId: user.accountId,
		})
	}

	useEffect(() => {
		if (!user?.sessionId) {
			navigate(`/login?next=/d/${params.id}`)
			return
		}

		(async () => {
			const result = await loadDoc()

			if (result.ok) {
				setDocument(result.json)
				setLastSave(new Date(result.json.lastUpdated))
				globalThis.document.title = `${getActionVerb()} '${result.json.title}'`
			} else {
				setError(result.json)
			}
		})()
	}, [user?.accountId, user?.sessionId, params?.id, navigate])

	const timeoutRef = useRef(null)

	useEffect(() => {
		return () => {
			clearTimeout(timeoutRef.current)
		}
	}, [])

	const documentChange = requirePrivilege(2, useCallback(async () => {
		const result = await post.to('/doc/write').send({
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
	}, [params.id, user?.accountId, user?.sessionId]))

	useEffect(() => {
		return () => {
			if (documentRef.current?.value !== undefined) {
				documentChange()
			}

			// clearTimeout(timeoutRef.current)
		}
	}, [documentRef.current?.value, documentChange])

	const test = useRef(0)

	const documentChangeThrottle = requirePrivilege(2, useCallback(async function (cb: (() => void | Promise<void>) = documentChange) {
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
	}, [documentChange, throttlePause]))

	function dashboardClick() {
		navigate('/dashboard')
	}

	function ShareButton() {
		const [canSend, setCanSend] = useState(null)

		const shareRef = useRef(null)

		const openModal = () => setShareModalOpen(true)
		const closeModal = () => setShareModalOpen(false)

		useEffect(() => {
			console.log(shareRef.current?.value)
		}, [shareRef.current?.value])

		const shareDocument = async () => {
			const response = await post.to('/doc/share').send({
				userId: user.accountId,
				documentId: params.id,
				sessionId: user.sessionId,
				guestUsername: shareRef.current.value
			})

			if (response.ok) {
				setDocument({ ...document, guests: document.guests.concat(response.json) })
				setShareModalOpen(false)
			}
		}

		return (
			<>
				<Button variant="contained" className="ShareButton" onClick={openModal}>
					<Share sx={{ marginRight: '1rem' }} />
					Share
				</Button>

				<Dialog TransitionComponent={Transition} maxWidth="xs" fullWidth open={shareModalOpen} onClose={closeModal}>
					<DialogTitle>Share Document</DialogTitle>
					<DialogContentText sx={{ margin: '1rem' }}>
						The account associated with this username will be able to see this document&apos;s content.
					</DialogContentText>
					<TextField
						inputRef={shareRef}
						sx={{ margin: '1rem' }}
						label="Guest's Username"
						variant="standard"
						error={!canSend && !!shareRef.current?.value} // Not a bug (a feature for now?)
						{...!canSend && !!shareRef.current?.value ? { helperText: 'woo' } : {}}
						onChange={() => {
							if (isUsernameValid(shareRef.current.value)) {
								if (!canSend) setCanSend(true)
							} else if (canSend) {
								setCanSend(false)
							}
						}}
					/>
					<DialogActions>
						<Button onClick={closeModal}>Cancel</Button>
						<Button onClick={shareDocument} variant="contained" disabled={!canSend}>Share</Button>
					</DialogActions>
				</Dialog>
			</>
		)
	}

	return (
		<>
			{user?.sessionId ? (
				<AnimatePresence>{
					!('name' in error) ? (
						<div className="Document" key="document">
							<div className="Document-tray">
								<motion.div
									className="Document-tray-main"
									initial={{ width: 0 }}
									animate={{ width: 'inherit' }}
									exit={{ x: window.innerWidth }}
								>
									<Typography mb="1rem" variant="h4" className="Document-tray-header">
										<Button variant="outlined" onClick={dashboardClick}>
											<ArrowBackIosNew sx={{ marginRight: '1rem' }} /> DASHBOARD
										</Button>
										<ShareButton />
										<span>Document Saved @ {formatDate(lastSave, true)}</span>
										<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }} />
										{document?.title} - {JSON.stringify(document?.guests)}
									</Typography>
									<div id="editor"></div>
									<CKEditor
										editor={Editor}
										data={document?.content}
										disabled={document?.privilege !== 2}
										onBlur={async () => await documentChange()}
										onChange={async () => {
											await documentChangeThrottle()
										}}
										onReady={editor => {
											documentRef.current = editor
										}}
									/>
								</motion.div>
							</div>
						</div>
					) : <AccessDenied />
				} </AnimatePresence>
			) : "Please sign in."}
		</>
	)
}