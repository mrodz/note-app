import { forwardRef, ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Context } from '../AccountContext'
import './Dashboard.scss'
import {
	Autocomplete,
	Button,
	Card,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControlLabel,
	FormGroup,
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
import AlarmOnIcon from '@mui/icons-material/AlarmOn'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { AnimatePresence, motion } from 'framer-motion'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import CloseIcon from '@mui/icons-material/Close'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { TransitionProps } from '@mui/material/transitions'
import { useNavigate } from 'react-router'
import { post, pushNotification } from '../App/App'
import sanitizeHtml from 'sanitize-html'
import AppHeading from '../App/AppHeading'
import { OneKkRounded, RemoveRedEye } from '@mui/icons-material'

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
	7: "Hello ✨",
	8: "Hola ✨",
	9: "Have a wonderful day 🙊"
}

/**
 * Picks a random blurb to display.
 * @returns a blurb
 */
function getBlurb(): string {
	const n = Math.floor(Math.random() * 10)
	return blurbs[n]
}

/**
 * Shortens a string to a manageable lenght.
 * @param str a string
 * @param limit the limit for this operation, defaults to 13
 * @returns the string trimmed to a max of 13 characters
 */
function trimString(str: string, limit: number = 127): string {
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
	return title.length > 0 && title.length < 64 && !/^\s+$/.test(title)
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
export const Transition = forwardRef(function Transition(
	props: TransitionProps & {
		children: ReactElement<any, any>
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction="up" ref={ref} {...props} />
})

/**
 * Debugger function.
 * @param arg0 an argument to be printed and yielded back.
 * @returns the argument passed
 */
const l = function <T>(arg0: T): T { // eslint-disable-line
	console.log(arg0)
	return arg0
}

export function formatDate(lastUpdated: Date, precise: boolean = false) {
	const today = new Date()

	/**
	 * Ensures all numbers are padded with leading zeroes.
	 * @param n a minute.
	 * @returns a string of length two to present a given number.
	 */
	function fixMinutes(n: number) {
		if (n > 9) return n
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
	// const lastUpdatedString = (() => {
	if (lastUpdated.getUTCDate() !== today.getUTCDate())
		return `${lastUpdated.getMonth() + 1}/${lastUpdated.getDate()}/${lastUpdated.getFullYear()}`

	const hours = fixHours(lastUpdated.getHours())
	const seconds = precise ? `:${fixMinutes(lastUpdated.getSeconds())}` : ''
	return `${hours > 12 ? hours - 12 : hours}:${fixMinutes(lastUpdated.getMinutes())}${seconds} ${hours < 12 ? "AM" : "PM"}`
	// })()
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
	// const [settingsRenameText, setSettingsRenameText] = useState('')

	const [canRename, setCanRename] = useState(false)

	const [documentsLoaded, setDocumentsLoaded] = useState({
		mine: true,
		guest: false
	})

	// react-router-dom hook
	const navigate = useNavigate()

	// references to TextFields, to get their value atomically.
	const createDocTitleRef = useRef(null)
	const renameDocRef = useRef(null)
	const searchDocRef = useRef(null)
	const originalDocuments = useRef([])

	const highlightGuests = documentsLoaded.guest && documentsLoaded.mine

	/**
	 * Construct an array of notes to display the value returned from the API lookup.
	 * @param documents the documents a user owns.
	 * @param navigate legacy 
	 * @returns 
	 */
	function notesFromDocuments(documents) {
		return documents?.map?.(e => {
			const lastUpdated = formatDate(new Date(e.lastUpdated))

			/**
			 * Callback function for a click on a note; navigates to the document with
			 * the specified id. Will always succeed in this context.
			 */
			function openDocument() {
				pushNotification(`Opening '${e.title}'`, {
					variant: 'success',
					clear: true
				})

				navigate(`/d/${e.id}`)
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

			const isGuest = '__GUEST__' in e

			return (
				<ListItem className='Dashboard-Note-clickable' sx={{ padding: 0, ...(isGuest && highlightGuests) ? { backgroundColor: '#bee6e8' } : {} }} button onClick={openDocument}>
					<div className="Dashboard-Note">
						<div className='Dashboard-Note-top'>
							<div>
								<Typography variant="h6" fontWeight="bold" className="Dashboard-Note-title">{e.title}</Typography>
								<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
									<Typography variant="caption" mr="1rem">Last saved {lastUpdated}</Typography>
								</div>
							</div>
							<div style={{ flexGrow: 1 }}></div>
							<div>
								{!isGuest ? (
									<Tooltip title="More" enterDelay={1000}>
										<IconButton className="Dashboard-Note-togglesettings" onClick={settingsClick}>
											<MoreVertIcon />
										</IconButton>
									</Tooltip>
								) : (
									<Tooltip title="You can only view this document" enterDelay={1000}>
										<RemoveRedEye />
									</Tooltip>
								)
								}
							</div>
						</div>
						<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }}></Divider>
						<Tooltip title="Preview" placement="top" enterDelay={1000}>
							<div className="Dashboard-Note-preview">
								<Typography variant="caption" mr="1rem">
									<span dangerouslySetInnerHTML={{
										__html: e.preview === null || /^\s*$/.test(e.preview)
											? "<i>Empty Document</i>"
											: trimString(sanitizeHtml(e.preview, {
												allowedTags: ['b', 'i', 'strong', 'u', 'br', 'p'],
											}))
									}} />
								</Typography>
							</div>
						</Tooltip>

					</div>
				</ListItem>
			)
		})
	}

	const submitSearch = (value: undefined | {
		data: string | string[],
		search: boolean
	} = undefined) => {
		let data
		let filtered

		const predicate = doc => doc.title.toLowerCase().includes(searchDocRef.current?.value.toLowerCase())

		if (value !== undefined) {
			data = Array.isArray(value.data) ? value.data : [value.data]
			if (value.search) {
				filtered = data.filter(predicate)
			} else {
				filtered = data
			}
		} else {
			filtered = (searchDocRef.current?.value?.length > 0
				? originalDocuments.current.filter(predicate)
				: originalDocuments.current)
		}

		setDocuments({
			loaded: true,
			list: filtered
		})
		// setSearchResultsState(filtered)
	}

	type loadDocInclude = {
		mine: boolean,
		guest: boolean
	}

	/**
	 * Memoized asynchronous function to request a user's documents.
	 * Called once on page load, and sets `documents`' state.
	 */
	const requestDocuments = useCallback(async function (include: loadDocInclude = { mine: true, guest: false }) {
		setDocuments({ loaded: false, list: [] })

		if (!include.guest && !include.mine) {
			originalDocuments.current = []
			submitSearch({
				data: [],
				search: false
			})
			return
		}

		// basic post request.
		/** @todo - timeout and try again. */
		const result = await post.to('/doc/all').send({
			sessionId: user.sessionId,
			userId: user.accountId,
			include: include
		})

		if (!result.ok) {
			pushNotification(result.json?.title ?? 'Error fetching your documents.', {
				variant: 'error',
				persist: true
			})
			return
		}

		// const len = result.json?.documents?.length ?? 0 + result.json?.guestDocuments?.length ?? 0
		const mine: Array<any> = result.json?.documents ?? []
		const guest: Array<any> = result.json?.guestDocuments ?? []
		const joined = mine.concat(guest)

		for (let i = 0; i < guest.length; i++) {
			guest[i]['__GUEST__'] = true
		}

		console.log(`<init> {${joined.map(d => d.title)}`);
		// setDocuments({ loaded: true, list: joined })
		originalDocuments.current = joined
		submitSearch({
			data: joined,
			search: true
		})
		// setSearchTargets(result.json)
	}, [user.accountId, user.sessionId])

	/**
	 * Open the settings menu and sets the states required to do this.
	 * @param e a document object.
	 */
	const openSettings = (e) => {
		setSettingsOpen({ open: true, document: e })
		// setSettingsRenameText(e.title.replace(/^\s+|\s+$|\s(?=\s)/gi, ''))
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
		document.title = 'Dashboard'
		setMessages({ greeting: getGreeting(), blurb: getBlurb() });

		(async () => {
			await requestDocuments(documentsLoaded)
		})()
	}, [requestDocuments])

	/**
	 * Send a POST request to create a document.
	 */
	const createDocument = async () => {
		try {
			if (!validateTitle(createDocTitleRef.current.value)) {
				pushNotification('Cannot set this as a title!', {
					variant: 'error',
					persist: true
				})
				return
			}

			const result = await post.to('/doc/create').send({
				title: createDocTitleRef.current.value,
				sessionId: user.sessionId,
				userId: user.accountId
			})

			pushNotification(result.ok ? `Created doc '${createDocTitleRef.current.value}'` : `Error: ${result.json?.name}`, {
				clear: true,
				variant: result.ok ? 'success' : 'error'
			})

			// if the document was created, re-render the dashboard to include it in the list.
			if (result.ok) {
				navigate(`/d/${result.json.documentId}`)
			}
		} finally {
			setOpenCreateDoc(false) // close the menu regardless.
			createDocTitleRef.current.value = ''
		}
	}

	/**
	 * Memoized callback function to rename a document. 
	 */
	const renameButton = useCallback(async function () {
		/// START checks - Validate the title before submitting a POST request.
		if (!validateTitle(renameDocRef.current.value)) {
			pushNotification('Cannot set this as a title', { variant: 'error' })
			return
		}

		if (renameDocRef.current.value === settingsOpen.document?.title) {
			pushNotification('This is already the title!', { variant: 'error' })
			return
		}
		/// END checks

		const result = await post.to('/doc/rename').send({
			documentId: settingsOpen?.document.id,
			sessionId: user.sessionId,
			userId: user.accountId,
			title: renameDocRef.current.value
		})

		pushNotification(result.ok ? `New name: '${result.json.title}'` : `Error: ${result.json.name}`, {
			clear: true,
			variant: result.ok ? 'success' : 'error',
			persist: !result.ok
		})

		if (result.ok) {
			// re-render the dashboard to include the renamed document.
			await requestDocuments(documentsLoaded)
			// close the modal.
			setSettingsOpen({ open: false, document: { ...settingsOpen.document, title: result.json.title } })
		}
	}, [renameDocRef, settingsOpen, requestDocuments, user.accountId, user.sessionId])

	// useEffect(() => {
	// 	console.log(documents.list);
	// }, [documents.list])

	/**
	 * Callback function to delete a document.
	 */
	async function deleteDocument() {
		try {
			const result = await post.to('/doc/delete').send({
				documentId: settingsOpen?.document?.id,
				sessionId: user.sessionId,
				userId: user.accountId
			})

			pushNotification(result.ok ? `Deleted '${settingsOpen?.document?.title}'` : `Error: ${result.json.name}`, {
				variant: result.ok ? 'success' : 'error',
				persist: !result.ok,
				clear: true
			})

			if (result.ok) await requestDocuments(documentsLoaded)
		} finally {
			setConfirmDelete(false) // close confirmation modal
			setSettingsOpen({ open: false, document: null }) // close settings modal
		}
	}

	const hasNoDocuments = (originalDocuments.current.length === 0 && (documentsLoaded.guest || documentsLoaded.mine))
	const noneSelected = !(documentsLoaded.guest || documentsLoaded.mine)

	const getNoDocumentsMessage = () => {
		let message: string = '';
		let and: boolean = false
		if (documentsLoaded.guest && (and = true)) message += "No one has shared a document with you"
		if (documentsLoaded.mine) message += `${and ? ' / ' : ''}You don't have have any documents yet`
		return message
	}

	return (
		<>
			<AppHeading user={user} />
			<motion.div
				key="dashboard"
				className='Dashboard'
				initial={{ width: 0 }}
				animate={{ width: 'inherit' }}
				exit={{ x: window.innerWidth * 2 }}
			>
				<div className="Dashboard-top">
					<div>
						<Typography variant="h3">{messages.greeting}, {user?.username}!</Typography>
						<Typography variant="h6" mt="1rem" ml="1rem"><AlarmOnIcon sx={{ marginRight: '1rem' }} />{messages.blurb}</Typography>
					</div>
					<div style={{ flexGrow: 1 }}></div>
					<div className='Dashboard-top-createdocument'>
						<Tooltip title="Create document">
							<IconButton id="create-document" onClick={(e) => { e.preventDefault(); setOpenCreateDoc(true) }}>
								<AddCircleIcon color="primary" sx={{ width: '4rem', height: '4rem' }} />
							</IconButton>
						</Tooltip>
					</div>
				</div>
				{/* {((() => { console.log(documents?.list?.length > 0); return documents?.list?.length > 0 })() || (!documentsLoaded.guest && !documentsLoaded.mine)) ? ( */}
				<>
					<div className="Dashboard-search-flex">
						<div className="Dashboard-search">
							<Autocomplete
								className='Dashboard-search-bar'
								freeSolo
								disableClearable
								selectOnFocus
								options={documents?.list ?? []}
								sx={{ flexGrow: 1, display: 'flex' }}
								getOptionLabel={o => {
									// console.log(o);

									return o.title
								}}
								onChange={(_, v, r) => {
									if (r === 'selectOption') submitSearch({
										data: v,
										search: true
									})
								}}
								renderInput={(params) => (
									<TextField
										{...params}
										sx={{
											display: 'grid',
											placeItems: 'center',
											marginRight: '5rem',
											flexGrow: 1
										}}
										inputRef={searchDocRef}
										label="Search Documents"
										variant="outlined"
										onChange={() => submitSearch()}
										InputProps={{
											...params.InputProps,
											type: 'search',
										}}
									/>
								)}
							/>
							<FormGroup>
								<Typography>Include:</Typography>
								<FormControlLabel control={<Checkbox defaultChecked onClick={async () => {
									const newFilter = { ...documentsLoaded, mine: !documentsLoaded.mine }
									setDocumentsLoaded(newFilter)
									await requestDocuments(newFilter)
								}} />} label="Your documents" />
								<FormControlLabel control={<Checkbox onClick={async () => {
									const newFilter = { ...documentsLoaded, guest: !documentsLoaded.guest }
									setDocumentsLoaded(newFilter)
									await requestDocuments(newFilter)
								}} />} label="Not your documents" />
							</FormGroup>
						</div>
					</div>
					{
						documents.list?.length > 0 ? (
							<div className="Dashboard-notes">
								{documentsToCards(!documents.loaded
									? Array(Number(user?.documentCount)).map((_, i) => <Note key={i} />)
									: notesFromDocuments(documents.list))
								}
							</div>
						) : documents.loaded && (
							hasNoDocuments ? (
								<Typography variant="h6" mt="5rem" sx={{ textAlign: 'center' }}>
									{getNoDocumentsMessage()}
								</Typography>
							) : (
								(documents.loaded) && <Typography variant="h6" mt="5rem" sx={{ textAlign: 'center' }}>
									{noneSelected ? <>
										Check one of the boxes above to load documents
									</> : (<>
										No documents matching: "{searchDocRef.current?.value}"
									</>)}
								</Typography>
							)
						)
					}
				</>
				{/* ) : ( */}
				{/* )} */}
			</motion.div>

			<Dialog open={openCreateDoc} TransitionComponent={Transition} keepMounted onClose={() => setOpenCreateDoc(false)}>
				<DialogTitle>Create Document</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						margin="dense"
						variant="standard"
						label="Title"
						inputRef={createDocTitleRef}
					/>
				</DialogContent>
				<DialogActions>
					<Button variant="text" onClick={() => setOpenCreateDoc(false)}>Cancel</Button>
					<Button variant="contained" onClick={createDocument}>Done</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={settingsOpen.open} maxWidth="xs" fullWidth onClose={closeSettings}>
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
							Last Edit: {settingsOpen.document?.lastUpdated}
						</ListItemText>
					</ListItem>

					<ListItem>
						<ListItemText>
							Created At: {settingsOpen.document?.createdAt}
						</ListItemText>
					</ListItem>

					<ListItem>
						<ListItemText>
							Unique Id: {settingsOpen.document?.id}
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
							onChange={() => {
								const text = renameDocRef.current.value

								// possible improvement: lazy evaluation could speed this up
								const goodLength = text.length !== 0,
									titlesUnique = text.replace(/^\s+|\s+$|\s(?=\s)/gi, '') !== settingsOpen.document?.title,
									nonWhiteSpace = !/^\s+$/g.test(text)

								if (goodLength && titlesUnique && nonWhiteSpace) {
									if (!canRename) setCanRename(true)
								} else {
									if (canRename) setCanRename(false)
								}
							}}
						/>
						<Button
							disabled={!canRename}
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