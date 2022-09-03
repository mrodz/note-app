import { forwardRef, ReactElement, useContext, useEffect, useRef, useState } from 'react'
import { Context } from '../AccountContext'
import './Dashboard.scss'
import {
	Button,
	Card,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Skeleton,
	Slide,
	TextField,
	Tooltip,
	Typography
} from '@mui/material'
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { motion } from 'framer-motion'
import { useSnackbar } from 'notistack';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { TransitionProps } from '@mui/material/transitions';

function getGreeting(hour: number = new Date().getHours()): string {
	if (hour >= 19 || hour < 5) return "Good Evening"
	if (hour >= 5 && hour < 12) return "Good Morning"
	if (hour >= 12 && hour < 19) return "Good Afternoon"
}

const blurbs = {
	0: "Here's what you've been working on",
	1: "Look at all your beautiful thoughts",
	2: "Let those creative juices flow!",
	3: "Just keep writing, Just keep writing...",
	4: "Look at all this writing!"
}

function getBlurb(): string {
	const n = Math.floor(Math.random() * 5);
	return blurbs[n];
}

function trimString(str: string): string {
	if (str.length > 13) {
		return str.substring(0, 11) + '...'
	}
	return str
}

function notesFromDocuments(documents) {
	return documents?.map?.(e => {
		const today = new Date();
		const lastUpdated = new Date(e.lastUpdated)

		const lastUpdatedString = (() => {
			if (lastUpdated.getUTCDate() !== today.getUTCDate())
				return `${lastUpdated.getMonth() + 1}/${lastUpdated.getDate()}/${lastUpdated.getFullYear()}`

			const hours = lastUpdated.getHours()
			return `${hours > 12 ? hours - 12 : hours}:${lastUpdated.getMinutes()} ${hours < 12 ? "AM" : "PM"}`
		})()

		return (
			<div className="Dashboard-Note">
				<div className='Dashboard-Note-top'>
					<div>
						<Typography variant="h6" fontWeight="bold" className="Dashboard-Note-title">{e.title}</Typography>
						<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
							<Typography variant="caption" mr="1rem">Last saved {lastUpdatedString}</Typography>{/*<BeenhereIcon sx={{ width: '1rem' }} />*/}
						</div>
					</div>
					<div style={{ flexGrow: 1 }}></div>
					<div>
						<IconButton onClick={() => document.dispatchEvent(new CustomEvent('on:open-doc-settings', {
							detail: e
						}))}>
							<MoreVertIcon />
						</IconButton>
					</div>
				</div>
				<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }}></Divider>
				<Typography variant="caption" mr="1rem"> {e.preview === null ? <i>Empty Document</i> : trimString(e.content)}</Typography>
			</div>
		)
	})
}

const Note = () => {
	return (
		<div className="Dashboard-Note">
			<Skeleton variant="rectangular" height="5rem"></Skeleton>
			<Skeleton width="70%"></Skeleton>
			<Skeleton width="30%"></Skeleton>
		</div>
	)
}

function sanitizeList(list: any[]) {
	return list.map((e, i) => <Card sx={{ margin: '1rem' }} key={i}>{e}</Card>)
}

const Transition = forwardRef(function Transition(
	props: TransitionProps & {
		children: ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction="up" ref={ref} {...props} />;
});

export default function Dashboard() {
	const user = useContext(Context)

	// [<done loading>, <documents>]
	const [documents, setDocuments] = useState({ loaded: false, list: [] })
	const [openCreateDoc, setOpenCreateDoc] = useState(false)
	const [snackbarCount, setSnackbarCount] = useState(1)
	const [messages, setMessages] = useState({ greeting: '', blurb: '' })
	const [settingsOpen, setSettingsOpen] = useState({ open: false, document: null })
	const [confirmDelete, setConfirmDelete] = useState(false);

	const { enqueueSnackbar, closeSnackbar } = useSnackbar()

	const createDocTitleRef = useRef(null)

	async function requestDocuments() {
		setSnackbarCount(snackbarCount + 1)

		const response = await fetch('http://localhost:5000/api/get-docs', {
			method: 'post',
			body: JSON.stringify({
				sessionId: user.sessionId,
				userId: user.accountId
			}),
			headers: { 'Content-Type': 'application/json' }
		})

		const data = await response.json()

		if (response.status !== 200) {
			enqueueSnackbar(data?.title ?? 'Error fetching your documents.', {
				variant: 'error',
				persist: true,
				key: 'LOGIN_' + snackbarCount,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGIN_' + snackbarCount) }}>{"×"}</Button>
			})
		}

		setDocuments({ loaded: true, list: data })
	}

	useEffect(() => {
		setMessages({ greeting: getGreeting(), blurb: getBlurb() });

		(async () => {
			await requestDocuments()
		})()

		const openSettings = (e) => {
			console.log(JSON.stringify(e.detail));

			// setAnchorEl(e.currentTarget);
			setSettingsOpen({ open: true, document: e.detail })
		}

		document.addEventListener('on:open-doc-settings', openSettings);

		return () => {
			document.removeEventListener('on:open-doc-settings', openSettings);
		}
	}, [])

	const createDocument = async () => {
		setSnackbarCount(snackbarCount + 1)

		try {
			const response = await fetch('http://localhost:5000/api/create-doc', {
				method: 'post',
				body: JSON.stringify({
					title: createDocTitleRef.current.value,
					sessionId: user.sessionId,
					userId: user.accountId
				}),
				headers: { 'Content-Type': 'application/json' }
			})

			const data = await response.json()

			enqueueSnackbar(response.status === 200 ? `Created doc '${createDocTitleRef.current.value}'` : `Error: ${data.name}`, {
				variant: 'success',
				persist: false,
				key: 'LOGIN_' + snackbarCount,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGIN_' + snackbarCount) }}>{"×"}</Button>
			})

			if (response.status === 200) await requestDocuments();
		} finally {
			setOpenCreateDoc(false)
		}
	}
	return (
		<>
			<motion.div
				className='Dashboard'
				initial={{ width: 0 }}
				animate={{ width: 'inherit' }}
				exit={{ x: window.innerWidth }}
			>
				<div className="Dashboard-top">
					<div>
						<Typography variant="h3">{messages.greeting}, {user?.username}</Typography>
						<Typography variant="h6" mt="1rem" ml="1rem"><AlarmOnIcon sx={{ marginRight: '1rem' }} />{messages.blurb}</Typography>
					</div>
					<div style={{ flexGrow: 1 }}></div>
					<div className='Dashboard-top-createdocument'>
						<Tooltip title="Create document">
							<IconButton onClick={() => setOpenCreateDoc(true)}>
								<AddCircleIcon color="primary" sx={{ width: '4rem', height: '4rem' }} />
							</IconButton>
						</Tooltip>
					</div>
				</div>
				{(!documents.loaded || documents?.list?.length > 0)
					? <div className="Dashboard-notes">
						{sanitizeList(!documents.loaded ? Array(Number(user?.documentCount)).fill(<Note />) : notesFromDocuments(documents.list))}
					</div>
					: <Typography variant="h6" mt="5rem" sx={{ textAlign: 'center' }}>
						You don&apos;t have have any documents yet!
					</Typography>
				}
			</motion.div>

			<Dialog open={openCreateDoc} TransitionComponent={Transition} keepMounted>
				<DialogTitle>Create Document</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						margin="dense"
						variant="standard"
						label="Name"
						inputRef={createDocTitleRef}
					/>
				</DialogContent>
				<DialogActions>
					<Button variant="text" onClick={() => setOpenCreateDoc(false)}>Cancel</Button>
					<Button variant="contained" onClick={createDocument}>Done</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={settingsOpen.open} maxWidth="xs" fullWidth={true} onClose={() => setSettingsOpen({ open: false, document: settingsOpen.document })}>
				<div className="Dashboard-Note-Settings-top">
					<DialogTitle>Your Document</DialogTitle>
					<div style={{ flexGrow: 1 }}></div>
					<IconButton sx={{ margin: '1rem' }} onClick={() => setSettingsOpen({ open: false, document: settingsOpen.document })}>
						<CloseIcon />
					</IconButton>
				</div>
				<Divider />
				<List>
					<ListItem>
						<ListItemText>
							Title: {settingsOpen.document?.title}
						</ListItemText>
					</ListItem>

					<ListItem>
						<ListItemText>
							Last Opened: {settingsOpen.document?.lastUpdated}
						</ListItemText>
					</ListItem>

					<ListItem>
						<ListItemText>
							Created At: {settingsOpen.document?.createdAt}
						</ListItemText>
					</ListItem>

					<ListItem>
						<ListItemText>
							Unique Id: {settingsOpen.document?.documentId}
						</ListItemText>
					</ListItem>

					<Divider />
					<ListItem button onClick={() => {
						setConfirmDelete(true)
					}}>
						<ListItemIcon>
							<DeleteForeverIcon />
						</ListItemIcon>
						<ListItemText>
							Delete
						</ListItemText>
					</ListItem>
					<ListItem button onClick={() => {

					}}>
						<ListItemIcon>
							<DriveFileRenameOutlineIcon />
						</ListItemIcon>
						<ListItemText>
							Rename
						</ListItemText>
					</ListItem>
				</List>
			</Dialog>

			<Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
				<DialogTitle>Delete "{settingsOpen.document?.title}"</DialogTitle>
				<DialogContentText sx={{ marginLeft: '2rem', marginRight: '2rem' }}>
					You are about to delete a document. Please make sure you meant to do this; deleting a document is permanent!
				</DialogContentText>
				<DialogActions>
					<Button variant="outlined" onClick={async () => {
						setSnackbarCount(snackbarCount + 1)

						try {
							const response = await fetch('http://localhost:5000/api/delete-doc', {
								method: 'post',
								body: JSON.stringify({
									documentId: settingsOpen?.document?.documentId,
									sessionId: user.sessionId,
									userId: user.accountId
								}),
								headers: { 'Content-Type': 'application/json' }
							})

							const data = await response.json()
							const success = response.status === 200

							enqueueSnackbar(success ? `Deleted '${settingsOpen?.document?.title}'` : `Error: ${data.name}`, {
								variant: success ? 'success' : 'error',
								persist: !success,
								key: 'LOGIN_' + snackbarCount,
								action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGIN_' + snackbarCount) }}>{"×"}</Button>
							})

							if (success) await requestDocuments()
						} finally {
							setConfirmDelete(false)
							setSettingsOpen({ open: false, document: null })
						}
					}} color="error">Delete</Button>
					<Button variant="contained" onClick={() => setConfirmDelete(false)}>Cancel</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}