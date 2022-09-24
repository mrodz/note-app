import {
	Alert,
	AvatarGroup,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemAvatar,
	ListItemSecondaryAction,
	ListItemText,
	TextField,
	Tooltip,
	Typography
} from "@mui/material"
import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from "react"
import { NavigateFunction, useNavigate, useParams } from "react-router"
import { Context, LocalStorageSessionInfo } from "../AccountContext"
import { CKEditor } from '@ckeditor/ckeditor5-react'
import Editor from 'ckeditor5-custom-build/build/ckeditor'
import "./Document.scss"
import { Link } from "react-router-dom"
import { memo } from "react"
import { formatDate, Transition } from "../Dashboard/Dashboard"
import { post, pushNotification } from "../App/App"
import {
	ArrowBackIosNew,
	Share,
	DoNotTouch as DoNotTouchIcon,
	Delete
} from "@mui/icons-material"
import { motion } from "framer-motion"
import { isUsernameValid } from "../Register/Register"
import { avatarFromUsername } from "../App/AppHeading"

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

const avatarsFromGuests = (guests: Array<Types.User>, tooltip?: boolean) => guests.map((e, i) => avatarFromUsername(e?.username, { key: i, tooltip: !!tooltip }))

export default function UserDocument() {
	const user: LocalStorageSessionInfo = useContext(Context)

	const [document, setDocument] = useState<Types.Document>(undefined)
	const [throttlePause, setThrottlePause] = useState<boolean>(false)
	const [lastSave, setLastSave] = useState(new Date())
	const [shareModalOpen, setShareModalOpen] = useState<boolean>(false)
	const [editor, setEditor] = useState({
		editor: null
	})
	const [loading, setLoading] = useState<boolean>(true)

	const params = useParams()
	const navigate: NavigateFunction = useNavigate()
	const documentRef: MutableRefObject<any> = useRef(null)

	const loadDoc = useCallback(async () => {
		return await post.to('/doc/get').send({
			documentId: params.id,
			sessionId: user.sessionId,
			userId: user.accountId,
		})
	}, [params.id, user.accountId, user.sessionId])

	useEffect(() => {
		if (loading) {
			(async () => {
				const result = await loadDoc()

				if (result.ok) {
					setDocument(result.json)
					setLastSave(new Date(result.json.lastUpdated))
					globalThis.document.title = `${result.json.privilege === 2 ? 'Editing' : 'Viewing'} '${result.json.title}'`
				} else {
					pushNotification(result.json?.name ?? 'Could not load document', {
						variant: 'error'
					})
				}

				setLoading(false)
			})()
		}
	}, [loading, loadDoc])

	const timeoutRef = useRef(null)

	useEffect(() => {
		if (!user?.sessionId) {
			navigate(`/login?next=/d/${params.id}`)
			return
		}

		return () => {
			clearTimeout(timeoutRef.current)
		}
	}, [navigate, params.id, user?.sessionId])

	const documentChange = useCallback(async () => {
		if (document?.privilege !== 2) return

		const result = await post.to('/doc/write').send({
			documentId: params.id,
			sessionId: user.sessionId,
			userId: user.accountId,
			newContent: documentRef.current.getData()
		}, ['ok', 'json'])

		if (!result.ok) {
			pushNotification(`Could not sync your data (${result.json?.name ?? 'unknown error'})`, {
				variant: 'error',
				persist: true
			})
		} else {
			setLastSave(new Date())
		}
	}, [document?.privilege, params.id, user?.accountId, user?.sessionId])

	useEffect(() => {
		return () => {
			if (documentRef.current?.value !== undefined) {
				documentChange()
			}
		}
	}, [documentRef.current?.value, documentChange])

	const enqueuedCount: MutableRefObject<number> = useRef(0)

	const documentChangeThrottle = useCallback(async function (cb: (() => void | Promise<void>) = documentChange) {
		if (document?.privilege !== 2) return

		const waiting = throttlePause

		enqueuedCount.current += 1

		setThrottlePause(true)
		if (waiting) return

		cb()

		timeoutRef.current = setTimeout(() => {
			if (enqueuedCount.current > 1) cb()
			enqueuedCount.current = 0
			setThrottlePause(false)
		}, 10_000)
	}, [documentChange, throttlePause, document?.privilege])

	useEffect(() => {
		const editor = (
			<CKEditor
				editor={Editor}
				data={document?.content}
				disabled={document?.privilege !== 2}
				onBlur={async () => await documentChange()}
				onChange={async () => await documentChangeThrottle()}
				onReady={e => documentRef.current = e}
			/>
		)

		setEditor({ editor: editor })
	}, [document?.content, document?.privilege, documentChange, documentChangeThrottle])

	function dashboardClick() {
		navigate('/dashboard')
	}

	const ShareButton = memo(() => {
		const [canSend, setCanSend] = useState(null)
		const [removeUser, setRemoveUser] = useState({
			open: false,
			user: {
				username: null,
				i: NaN,
			}
		})

		const shareRef = useRef(null)

		const openModal = () => setShareModalOpen(true)
		const closeModal = () => setShareModalOpen(false)

		const shareDocument = async () => {
			const username: string = shareRef.current.value
			const response = await post.to('/doc/share').send({
				userId: user.accountId,
				documentId: params.id,
				sessionId: user.sessionId,
				guestUsername: username
			})

			if (response.ok) {
				pushNotification(`Shared document with ${username}`, { clear: true })
				setShareModalOpen(false)
				setDocument({ ...document, guests: document.guests.concat(response.json) })
			} else {
				pushNotification(response.json?.name ?? 'Could not share document', {
					variant: 'error'
				})
				closeModal()
			}
		}

		const closeConfirm = () => setRemoveUser({ ...removeUser, open: false })

		const removeGuest = async () => {
			const result = await post.to('/doc/deshare').send({
				userId: user?.accountId,
				sessionId: user?.sessionId,
				documentId: params?.id,
				guestUsername: removeUser.user.username
			}, ['ok'])

			if (result.ok) {
				document.guests.splice(removeUser.user.i, 1) // remove from UI
				setDocument({ ...document })                 // push UI change

				pushNotification(`Removed '${removeUser.user.username}'`)
			} else {
				pushNotification('Error removing user', { variant: 'error' })
			}
		}

		return (
			<>
				<Button disabled={document?.privilege !== 2} variant="contained" className="ShareButton" onClick={openModal}>
					<Share sx={{ marginRight: '1rem' }} />
					Share
				</Button>

				<Dialog TransitionComponent={Transition} maxWidth="xs" fullWidth open={shareModalOpen} onClose={closeModal}>
					<DialogTitle>Share Document</DialogTitle>
					<DialogContentText sx={{ margin: '1rem' }}>
						The account associated with this username will be able to see this document&apos;s content.
					</DialogContentText>
					<DialogContentText sx={{ margin: '1rem' }}>
						Current Guests:
					</DialogContentText>

					{(!!document?.guests && document.guests.length > 0) ? (
						<DialogContent sx={{ maxHeight: '10rem', paddingTop: 0, paddingBottom: 0 }}>
							<List>
								{avatarsFromGuests(document.guests).map((e, i) => (
									<ListItem key={i}>
										<ListItemAvatar>
											{e}
										</ListItemAvatar>
										<ListItemText primary={document.guests[i].username} secondary="Guest" />
										<ListItemSecondaryAction>
											<Tooltip title={`Remove ${document.guests[i].username}`} placement="left">
												<IconButton onClick={() => {
													setRemoveUser({
														open: true,
														user: {
															username: document.guests[i].username,
															i: i,
														}
													})
												}}>
													<Delete />
												</IconButton>
											</Tooltip>
										</ListItemSecondaryAction>
									</ListItem>
								))}
							</List>
						</DialogContent>
					) : (
						<DialogContentText sx={{ textAlign: 'center' }}><i>There&apos;s nobody! &#129431;</i></DialogContentText>
					)}
					<TextField
						inputRef={shareRef}
						sx={{ margin: '1rem' }}
						label="Guest's Username"
						variant="standard"
						error={!canSend && !!shareRef.current?.value} // Not a bug (a feature for now?)
						{...!canSend && !!shareRef.current?.value ? { helperText: 'Invalid account' } : {}}
						onChange={() => {
							const username = shareRef.current.value
							if (isUsernameValid(username) && username !== user.username) {
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

				<Dialog open={removeUser.open} onClose={closeConfirm}>
					<DialogTitle>
						Remove Guest
					</DialogTitle>
					<DialogContent sx={{ display: 'flex' }}>
						<div style={{ marginRight: '1rem', display: 'grid', placeItems: 'center' }}>
							{avatarFromUsername(removeUser.user.username, { tooltip: true })}
						</div>
						<DialogContentText sx={{ margin: '1rem', display: 'flex' }}>
							'{removeUser.user.username}' will no longer be able to view this document.
							You can always add them back later.
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" onClick={closeConfirm}>Cancel</Button>
						<Button variant="outlined" onClick={() => {
							removeGuest()
							closeConfirm()
						}} color="error">Confirm</Button>
					</DialogActions>
				</Dialog>
			</>
		)
	})

	return (
		<>
			{user?.sessionId ? (
				(document?.privilege !== 0) ? (
					<motion.div
						className="Document"
						key="document"
						initial={{ filter: 'blur(1rem)' }}
						animate={{ filter: 'blur(0)' }}
						exit={{ x: window.innerWidth * 2 }}
					>
						{document?.privilege === 1 && <Alert severity="info">
							You can view this document&apos;s content, but not edit it.
							<Button color="info" sx={{ marginLeft: '1rem' }} onClick={() => window.location.reload()}>
								Refresh Content
							</Button>
						</Alert>}
						<div className="Document-tray">
							<div className="Document-tray-main">
								<Typography mb="1rem" variant="h4" className="Document-tray-header">
									<Button variant="outlined" onClick={dashboardClick}>
										<ArrowBackIosNew sx={{ marginRight: '1rem' }} /> DASHBOARD
									</Button>
									<ShareButton />
									<span>Document Saved @ {formatDate(lastSave, true)}</span>
									<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }} />
									<div className="Document-tray-header-content">
										<div>{document?.title}</div>
										{(!!document?.guests && document.guests.length > 0) && (
											<>
												<div style={{ flexGrow: 1 }}></div>
												{document?.privilege === 1 && (
													<Typography variant="caption" className="Document-tray-guestlist">
														Owner:
														<div style={{ marginLeft: '1rem' }}>
															{avatarFromUsername(document?.User.username, { tooltip: true })}
														</div>
													</Typography>
												)}
												<Typography variant="caption" className="Document-tray-guestlist">
													{document?.privilege === 2 ? <>Shared With:</> : <>Guests:</>}
													<AvatarGroup sx={{ marginLeft: '1rem' }} max={4}>
														{avatarsFromGuests(document?.guests, true)}
													</AvatarGroup>
												</Typography>
											</>
										)}
									</div>
								</Typography>
								<div id="editor"></div>
								{editor.editor}
							</div>
						</div>
					</motion.div>
				) : <AccessDenied />
			) : "Please sign in."
			}
		</>
	)
}