import { forwardRef, ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
import { useNavigate } from 'react-router';

/**
 * Greets a user according to the time of day.
 * @param hour a number, 1-24
 * @returns the correct greeting.
 */
function getGreeting(hour: number = new Date().getHours()): string {
	if (hour >= 19 || hour < 5) return "good evening"
	if (hour >= 5 && hour < 12) return "good morning"
	if (hour >= 12 && hour < 19) return "good afternoon"
}

const blurbs = {
	0: "Here's what you've been working on",
	1: "Look at all your beautiful thoughts",
	2: "Let those creative juices flow",
	3: "Just keep writing, Just keep writing...",
	4: "Look at all this writing",
	5: "Your documents, all in one place",
	6: "I positively adore writing",
	7: "Me encanta muchísmo escribir",
	8: "Hello :)",
	9: "Hola :)"
}

/**
 * Picks a random blurb to display.
 * @returns a blurb
 */
function getBlurb(): string {
	const n = Math.floor(Math.random() * 5);
	return blurbs[n];
}

/**
 * Shortens a string to a manageable lenght.
 * @param str a string
 * @param limit the limit for this operation, defaults to 13
 * @returns the string trimmed to a max of 13 characters
 */
function trimString(str: string, limit: number = 63): string {
	if (str.length > limit) {
		return str.substring(0, limit - 2) + '...'
	}
	return str
}

/**
 * Skeleton placeholder for a document in the dashboard view.
 * @returns A Skeleton to be rendered while documents are loading.
 */
const Note = () => {
	return (
		<div className="Dashboard-Note">
			<Skeleton variant="rectangular" height="5rem" width="70%"></Skeleton>
			<Skeleton width="70%"></Skeleton>
			<Skeleton width="30%"></Skeleton>
		</div>
	)
}

/**
 * A document's title must satisfy:
 * - A length greater than zero and less than 64 characters.
 * - Non-whitespace characters.
 * @param title a document title
 * @returns whether it can be a valid title.
 */
function validateTitle(title: string): boolean {
	return title.length > 0 && title.length < 64 && !/^\s+$/.test(title);
}

/**
 * Wraps a list of documents in Cards.
 * @param list a list of documents.
 * @returns Cards[]
 */
function documentsToCards(list: any[]) {
	return list.map((e, i) => <Card sx={{ margin: '1rem' }} key={i}>{e}</Card>)
}

/**
 * Slide-up transition, used in the create document menu.
 */
const Transition = forwardRef(function Transition(
	props: TransitionProps & {
		children: ReactElement<any, any>;
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Debugger function.
 * @param arg0 an argument to be printed and yielded back.
 * @returns the argument passed
 */
const l = function <T>(arg0: T): T { // eslint-disable-line
	console.trace(arg0)
	return arg0
}

/**
 * # Known issues:
 * - The amount of skeleton documents shown during loading
 *   is only calculated on user sign in, and does not reflect
 *   changes created during this session.
 * - close modal on bg click for create doc
 * 
 * @returns JSX for the main dashboard component.
 */
export default function Dashboard() {
	const user = useContext(Context)

	// used to save a message for the lifetime of the component.
	const [messages, setMessages] = useState({ greeting: '', blurb: '' })

	// {<done loading>, <documents>}
	const [documents, setDocuments] = useState({ loaded: false, list: [] })

	// toggle the create document menu
	const [openCreateDoc, setOpenCreateDoc] = useState(false)

	// {<settings menu open>, <the document being examined>}
	const [settingsOpen, setSettingsOpen] = useState({ open: false, document: null })

	// toggle the confirm delete menu
	const [confirmDelete, setConfirmDelete] = useState(false)

	// the new document title, stateful value to force repaints on text update.
	const [settingsRenameText, setSettingsRenameText] = useState('')

	// snackbar hook
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()

	// react-router-dom hook
	const navigate = useNavigate()

	// references to TextFields, to get their value atomically.
	const createDocTitleRef = useRef(null)
	const renameDocRef = useRef(null)

	/**
	 * Construct an array of notes to display the value returned from the API lookup.
	 * @param documents the documents a user owns.
	 * @param navigate legacy 
	 * @returns 
	 */
	function notesFromDocuments(documents) {
		return documents?.map?.(e => {
			const today = new Date();
			const lastUpdated = new Date(e.lastUpdated)

			/**
			 * Ensures all numbers are padded with leading zeroes.
			 * @param n a minute.
			 * @returns a string of length two to present a given number.
			 */
			function fixMinutes(n: number) {
				if (n > 10) return n
				return '0' + n
			}

			function fixHours(n: number) {
				if (n === 0) return 12
				return n
			}

			/**
			 * Constructs a message to inform the user of the last time their 
			 * document was updated.
			 * 
			 * If this date was today (chronologically), return a timestamp to 
			 * the minute (HH:mm AM/PM). Otherwise, return the date (MM/DD/YYYY)
			 */
			const lastUpdatedString = (() => {
				if (lastUpdated.getUTCDate() !== today.getUTCDate())
					return `${lastUpdated.getMonth() + 1}/${lastUpdated.getDate()}/${lastUpdated.getFullYear()}`

				const hours = fixHours(lastUpdated.getHours())
				return `${hours > 12 ? hours - 12 : hours}:${fixMinutes(lastUpdated.getMinutes())} ${hours < 12 ? "AM" : "PM"}`
			})()

			/**
			 * Callback function for a click on a note; navigates to the document with
			 * the specified id. Will always succeed in this context.
			 */
			function openDocument() {
				navigate(`/d/${e.documentId}`)
			}

			/**
			 * Callback function for a click on a note's settings menu.
			 * @param event a MouseEvent to be terminated before bubbling.
			 */
			function settingsClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
				// Ensures clicks to the settings menu do not trigger a new page
				// load (to the document). It is critical; DO NOT DELETE
				event.stopPropagation()

				openSettings(e)
			}

			return (
				<ListItem className='Dashboard-Note-clickable' sx={{ padding: 0 }} button onClick={openDocument}>
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
								<IconButton className="Dashboard-Note-togglesettings" onClick={settingsClick}>
									<MoreVertIcon />
								</IconButton>
							</div>
						</div>
						<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }}></Divider>
						<Typography variant="caption" mr="1rem"> {e.preview === null || /^\s*$/.test(e.preview) ? <i>Empty Document</i> : trimString(e.preview)}</Typography>
					</div>
				</ListItem>
			)
		})
	}

	/**
	 * Memoized asynchronous function to request a user's documents.
	 * Called once on page load, and sets `documents`' state.
	 */
	const requestDocuments = useCallback(async function () {
		// basic post request.
		/** @todo - timeout and try again. */
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
			const key = 'DASHBOARD_' + Math.random()
			enqueueSnackbar(data?.title ?? 'Error fetching your documents.', {
				variant: 'error',
				persist: true,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})
			return
		}

		setDocuments({ loaded: true, list: data })
	}, [closeSnackbar, enqueueSnackbar, user.accountId, user.sessionId])

	/**
	 * Open the settings menu and sets the states required to do this.
	 * @param e a document object.
	 */
	const openSettings = (e) => {
		setSettingsOpen({ open: true, document: e });
		setSettingsRenameText(e.title.replace(/^\s+|\s+$|\s(?=\s)/gi, ''));
	}

	/**
	 * Closes the settings menu for a document.
	 */
	const closeSettings = () => {
		setSettingsOpen({ open: false, document: settingsOpen.document })
	}

	// Runs on component mount ONCE. May fire twice during 
	// development if using <React.StrictMode />
	useEffect(() => {
		setMessages({ greeting: getGreeting(), blurb: getBlurb() });
		(async () => {
			await requestDocuments()
		})()
	}, [requestDocuments])

	/**
	 * Send a POST request to create a document.
	 */
	const createDocument = async () => {
		try {
			if (!validateTitle(createDocTitleRef.current.value)) {
				const key = 'DASHBOARD_' + Math.random()
				enqueueSnackbar('Cannot set this as a title!', {
					variant: 'error',
					persist: true,
					key: key,
					action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
				})

				return
			}

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
			const success = response.status === 200

			closeSnackbar()
			const key = 'DASHBOARD_' + Math.random()
			enqueueSnackbar(success ? `Created doc '${createDocTitleRef.current.value}'` : `Error: ${data.name}`, {
				variant: success ? 'success' : 'error',
				persist: false,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})

			// if the document was created, re-render the dashboard to include it in the list.
			if (response.status === 200) await requestDocuments();
		} finally {
			setOpenCreateDoc(false) // close the menu regardless.
		}
	}

	/**
	 * Memoized callback function to rename a document. 
	 */
	const renameButton = useCallback(async function () {
		/// START checks - Validate the title before submitting a POST request.
		if (!validateTitle(renameDocRef.current.value)) {
			const key = 'DASHBOARD_' + Math.random()
			enqueueSnackbar('Cannot set this as a title!', {
				variant: 'error',
				persist: false,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})
			return;
		}

		if (renameDocRef.current.value === settingsOpen.document?.title) {
			const key = 'DASHBOARD_' + Math.random()
			enqueueSnackbar('This is already the title!', {
				variant: 'error',
				persist: false,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})
			return;
		}
		/// END checks

		const response = await fetch('http://localhost:5000/api/rename-doc', {
			method: 'post',
			body: JSON.stringify({
				documentId: settingsOpen?.document.documentId,
				sessionId: user.sessionId,
				userId: user.accountId,
				title: renameDocRef.current.value
			}),
			headers: { 'Content-Type': 'application/json' }
		})

		const data = await response.json()
		const success = response.status === 200

		closeSnackbar()
		const key = 'DASHBOARD_' + Math.random()
		enqueueSnackbar(success ? `New name: '${data.title}'` : `Error: ${data.name}`, {
			variant: success ? 'success' : 'error',
			persist: !success,
			key: key,
			action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
		})

		if (success) {
			// re-render the dashboard to include the renamed document.
			await requestDocuments()
			// close the modal.
			setSettingsOpen({ open: false, document: { ...settingsOpen.document, title: data.title } })
		}
	}, [renameDocRef, settingsOpen, closeSnackbar, enqueueSnackbar, requestDocuments, user.accountId, user.sessionId])

	/**
	 * Callback function to delete a document.
	 */
	async function deleteDocument() {
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

			closeSnackbar()
			const key = 'DASHBOARD_' + Math.random()
			enqueueSnackbar(success ? `Deleted '${settingsOpen?.document?.title}'` : `Error: ${data.name}`, {
				variant: success ? 'success' : 'error',
				persist: !success,
				key: key,
				action: () => <Button color="secondary" onClick={() => { closeSnackbar(key) }}>{"×"}</Button>
			})

			if (success) await requestDocuments()
		} finally {
			setConfirmDelete(false) // close confirmation modal
			setSettingsOpen({ open: false, document: null }) // close settings modal
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
						<Typography variant="h3">{messages.greeting}, {user?.username}!</Typography>
						<Typography variant="h6" mt="1rem" ml="1rem"><AlarmOnIcon sx={{ marginRight: '1rem' }} />{messages.blurb}</Typography>
					</div>
					<div style={{ flexGrow: 1 }}></div>
					<div className='Dashboard-top-createdocument'>
						<Tooltip title="Create document">
							<IconButton onClick={(e) => { e.preventDefault(); setOpenCreateDoc(true) }}>
								<AddCircleIcon color="primary" sx={{ width: '4rem', height: '4rem' }} />
							</IconButton>
						</Tooltip>
					</div>
				</div>
				{(!documents.loaded || documents?.list?.length > 0)
					? (
						<div className="Dashboard-notes">
							{documentsToCards(!documents.loaded
								? Array(Number(user?.documentCount)).fill(<Note />)
								: notesFromDocuments(documents.list))
							}
						</div>
					) : (
						<Typography variant="h6" mt="5rem" sx={{ textAlign: 'center' }}>
							You don&apos;t have have any documents yet!
						</Typography>
					)
				}
			</motion.div>

			<Dialog open={openCreateDoc} TransitionComponent={Transition} keepMounted onClose={() => setOpenCreateDoc(false)}>
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

			<Dialog open={settingsOpen.open} maxWidth="xs" fullWidth={true} onClose={closeSettings}>
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
					<ListItem>
						<ListItemIcon>
							<DriveFileRenameOutlineIcon />
						</ListItemIcon>
						<TextField
							inputRef={renameDocRef} autoFocus variant="standard"
							defaultValue={settingsOpen.document?.title}
							onChange={() => setSettingsRenameText(renameDocRef.current.value)}
						/>
						<Button
							disabled={
								settingsRenameText.length === 0 ||
								settingsRenameText.replace(/^\s+|\s+$|\s(?=\s)/gi, '') === settingsOpen.document?.title ||
								/^\s+$/.test(settingsRenameText)
							}
							variant="contained"
							sx={{ marginLeft: '1rem' }}
							onClick={renameButton}>Rename</Button>
					</ListItem>

					<ListItem button onClick={() => setConfirmDelete(true)}>
						<ListItemIcon>
							<DeleteForeverIcon />
						</ListItemIcon>
						<ListItemText>
							Delete
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
					<Button variant="outlined" onClick={deleteDocument} color="error">Delete</Button>
					<Button variant="contained" onClick={() => setConfirmDelete(false)}>Cancel</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}