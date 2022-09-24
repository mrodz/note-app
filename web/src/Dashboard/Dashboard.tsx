import { forwardRef, MutableRefObject, ReactElement, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Context, LocalStorageSessionInfo } from '../AccountContext'
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
import { motion } from 'framer-motion'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import CloseIcon from '@mui/icons-material/Close'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { TransitionProps } from '@mui/material/transitions'
import { NavigateFunction, useNavigate } from 'react-router'
import { post, pushNotification } from '../App/App'
import sanitizeHtml from 'sanitize-html'
import AppHeading from '../App/AppHeading'
import { RemoveRedEye } from '@mui/icons-material'
import { memo } from 'react'

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
const Note = memo(() => {
	return (
		<div className="Dashboard-Note">
			<Skeleton variant="rectangular" height="5rem" width="70%"></Skeleton>
			<Skeleton width="70%"></Skeleton>
			<Skeleton width="30%"></Skeleton>
		</div>
	)
})

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
	if (lastUpdated.getUTCDate() !== today.getUTCDate())
		return `${lastUpdated.getMonth() + 1}/${lastUpdated.getDate()}/${lastUpdated.getFullYear()}`

	const hours = fixHours(lastUpdated.getHours())
	const seconds = precise ? `:${fixMinutes(lastUpdated.getSeconds())}` : ''
	return `${hours > 12 ? hours - 12 : hours}:${fixMinutes(lastUpdated.getMinutes())}${seconds} ${hours < 12 ? "AM" : "PM"}`
}

/// START @framer-motion animations - for document cards
const list = {
	visible: {
		transition: {
			type: "spring",
			bounce: 0,
			duration: 0.7,
			delayChildren: 0.3,
			staggerChildren: 0.05
		}
	},
	hidden: {
		transition: {
			type: "spring",
			bounce: 0,
			duration: 0.3
		}
	}
}

const item = {
	visible: { opacity: 1, x: 0 },
	hidden: { opacity: 0, x: -100 },
}
/// END @framer-motion animations

/**
 * # Known issues:
 * - The amount of skeleton documents shown during loading
 *   is only calculated on user sign in, and does not reflect
 *   changes created during this session.
 * 
 * @returns JSX for the main dashboard component.
 */
export default function Dashboard() {
	type LoadDocInclude = {
		mine: boolean,
		guest: boolean
	}

	type SetSettingsOpen = {
		open: boolean,
		document: Types.Document
	}

	type SetDocuments = {
		loaded: boolean,
		list: Types.Document[]
	}

	type SetMessages = {
		greeting: string,
		blurb: string
	}

	const user: LocalStorageSessionInfo = useContext(Context)

	// used to save a message for the lifetime of the component.
	const [messages, setMessages] = useState<SetMessages>({ greeting: '', blurb: '' })

	// {<done loading>, <documents>}
	const [documents, setDocuments] = useState<SetDocuments>({ loaded: false, list: [] })

	// toggle the create document menu
	const [openCreateDoc, setOpenCreateDoc] = useState<boolean>(false)

	// {<settings menu open>, <the document being examined>}
	const [settingsOpen, setSettingsOpen] = useState<SetSettingsOpen>({ open: false, document: null })

	// toggle the confirm delete menu
	const [confirmDelete, setConfirmDelete] = useState<boolean>(false)

	// whether the user can rename a document or not. Used in the rename modal.
	const [canRename, setCanRename] = useState<boolean>(false)

	// which types of documents can the user load
	const [documentsLoaded, setDocumentsLoaded] = useState<LoadDocInclude>({
		mine: true,
		guest: false
	})

	// react-router-dom hook
	const navigate: NavigateFunction = useNavigate()

	// references to TextFields, to get their value atomically.
	const createDocTitleRef: MutableRefObject<HTMLInputElement> = useRef(null)
	const renameDocRef: MutableRefObject<HTMLInputElement> = useRef(null)
	const searchDocRef: MutableRefObject<HTMLInputElement> = useRef(null)
	const originalDocuments: MutableRefObject<Types.Document[]> = useRef([])

	// make it easier to spot other people's documents when
	// viewing guest documents along with your own
	const highlightGuests: boolean = documentsLoaded.guest && documentsLoaded.mine

	/**
	 * Callback function for a click on a note; navigates to the document with
	 * the specified id. Will always succeed in this context.
	 */
	function openDocument(title, id) {
		pushNotification(`Opening '${title}'`, {
			variant: 'success',
			clear: true
		})

		navigate(`/d/${id}`)
	}

	/**
	 * Callback function for a click on a note's settings menu.
	 * @param event a MouseEvent to be terminated before bubbling.
	 */
	function settingsClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>, document: Types.Document) {
		// Ensures clicks to the settings menu do not trigger a new page
		// load (to the document). It is critical; DO NOT DELETE
		event.stopPropagation()

		openSettings(document)
	}

	const DocumentNote = memo((props: {
		document: Types.Document,
	}) => {
		const lastUpdated: string = formatDate(new Date(props.document.lastUpdated))
		const isGuest = '__GUEST__' in props.document

		return (
			<motion.div
				key={props.document.id}
				className='Dashboard-Note-clickable'
				variants={item}
			>
				<ListItem sx={{ padding: 0, height: '100%', ...(isGuest && highlightGuests) ? { backgroundColor: '#bee6e8' } : {} }} button onClick={() => openDocument(props.document.title, props.document.id)}>
					<div className="Dashboard-Note">
						<div className='Dashboard-Note-top'>
							<div>
								<Typography variant="h6" fontWeight="bold" className="Dashboard-Note-title">{props.document.title}</Typography>
								<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
									<Typography variant="caption" mr="1rem">Last saved {lastUpdated}</Typography>
								</div>
							</div>
							<div style={{ flexGrow: 1 }}></div>
							<div>
								{!isGuest ? (
									<Tooltip title="More" enterDelay={1000}>
										<IconButton className="Dashboard-Note-togglesettings" onClick={e => settingsClick(e, props.document)}>
											<MoreVertIcon />
										</IconButton>
									</Tooltip>
								) : (
									<Tooltip title="You can only view this document" enterDelay={1000}>
										<RemoveRedEye />
									</Tooltip>
								)}
							</div>
						</div>
						<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }}></Divider>
						<Tooltip title="Preview" placement="top" enterDelay={1000}>
							<div className="Dashboard-Note-preview">
								<Typography variant="caption" mr="1rem">
									<span dangerouslySetInnerHTML={{
										__html: props.document.preview === null || /^\s*$/.test(props.document.preview)
											? "<i>Empty Document</i>"
											: trimString(sanitizeHtml(props.document.preview, {
												allowedTags: ['b', 'i', 'strong', 'u', 'br', 'p'],
											}))
									}} />
								</Typography>
							</div>
						</Tooltip>

					</div>
				</ListItem>
			</motion.div>
		)
	})

	/**
	 * Construct an array of notes to display the value returned from the API lookup.
	 * @param documents the documents a user owns.
	 * @param navigate legacy 
	 * @returns 
	 */
	function notesFromDocuments(documents: Types.Document[]): JSX.Element[] {
		return documents?.map?.(e => <DocumentNote document={e} />)
	}

	type SubmitSearchProps = {
		/**
		 * Data to serve as a replacement from the original documents' titles.
		 */
		data: Types.Document | Types.Document[],
		/**
		 * Whether or not to apply the predicate
		 */
		search: boolean
	}

	/**
	 * ### This function:
	 * - Searches the documents obtained from the last POST request to '/api/doc/all'
	 *   - Filters for those whose title includes the search text
	 *   - Save the result as the documents rendered to the screen 
	 * 
	 * ### Default predicate:
	 * ```js
	 * function predicate(doc) {
	 * 	let title = doc.title.toLowerCase()
	 * 	let search = searchDocRef.current?.value.toLowerCase()
	 * 
	 * 	return title.includes(search)
	 * }
	 * ```
	 * 
	 * @param value Optionally, pass in an object of type {@link SubmitSearchProps}
	 * for special filtering.
	 */
	const submitSearch = useCallback((value: undefined | SubmitSearchProps = undefined) => {
		let filtered: Types.Document[]

		const predicate = doc => doc.title.toLowerCase().includes(searchDocRef.current?.value.toLowerCase())

		if (value !== undefined) {
			let data = Array.isArray(value.data) ? value.data : [value.data]
			filtered = value.search ? data.filter(predicate) : data
		} else {
			filtered = searchDocRef.current?.value?.length > 0
				? originalDocuments.current.filter(predicate)
				: originalDocuments.current
		}

		// repaint
		setDocuments({
			loaded: true,
			list: filtered
		})
	}, [])

	/**
	 * Memoized asynchronous function to request a user's documents.
	 * Called once on page load, and sets `documents`' state.
	 */
	const requestDocuments = useCallback(async function (include: LoadDocInclude = { mine: true, guest: false }) {
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

		// const mine: Types.Document[] = result.json?.documents ?? []
		// const guest: Types.Document[] = result.json?.guestDocuments ?? []
		const joined: Types.Document[] = result.json?.documents

		console.log(joined);


		// for (let i = 0; i < joined.length; i++) {
		// 	if (joined[i].privilege === 1) joined[i]['__GUEST__'] = true
		// }

		originalDocuments.current = joined

		submitSearch({
			data: joined,
			search: true
		})
	}, [user.accountId, user.sessionId, submitSearch])

	/**
	 * Open the settings menu and sets the states required to do this.
	 * @param e a document object.
	 */
	const openSettings = (e: Types.Document) => {
		setSettingsOpen({ open: true, document: e })
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
	}, [documentsLoaded, requestDocuments])

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
			sessionId: user.sessionId,
			userId: user.accountId,
			title: renameDocRef.current.value,
			documentId: settingsOpen?.document.id
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
	}, [renameDocRef, settingsOpen, documentsLoaded, user.accountId, user.sessionId, requestDocuments])

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

	const hasNoDocuments: boolean = (originalDocuments.current.length === 0 && (documentsLoaded.guest || documentsLoaded.mine))
	const noneSelected: boolean = !(documentsLoaded.guest || documentsLoaded.mine)

	const getNoDocumentsMessage: () => string = () => {
		let message: string = '';
		let and: string = '' // delimeter for two reasons

		// message for part 1 (will also add set delimeter if applicable)
		if (documentsLoaded.guest && (and = '/')) message += "No one has shared a document with you"
		// message for part 2
		if (documentsLoaded.mine) message += `${and}You don't have have any documents yet`

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
								getOptionLabel={o => typeof o === 'string' ? o : o.title}
								onChange={(_, v, r) => {
									// this code will fire if the user clicks
									// an Autocomplete option from the list.
									if (r === 'selectOption' && typeof v !== 'string') {
										submitSearch({
											data: v as Types.Document,
											search: true
										})
									}
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
								<Tooltip enterDelay={1000} title="These are documents you've created">
									<FormControlLabel control={<Checkbox defaultChecked onClick={async () => {
										// Include user's own documents in the collection
										documentsLoaded.mine = !documentsLoaded.mine
										setDocumentsLoaded(documentsLoaded)
										await requestDocuments(documentsLoaded)
									}} />} label="Your documents" />
								</Tooltip>
								<Tooltip enterDelay={1000} title="These are documents others have shared with you">
									<FormControlLabel control={<Checkbox onClick={async () => {
										// Include guest documents in the collection
										documentsLoaded.guest = !documentsLoaded.guest
										setDocumentsLoaded(documentsLoaded)
										await requestDocuments(documentsLoaded)
									}} />} label="Other documents" />
								</Tooltip>
							</FormGroup>
						</div>
					</div>
					{
						documents.list?.length > 0 ? (
							<motion.div
								className="Dashboard-notes"
								initial="hidden"
								animate="visible"
								variants={list}
							>
								{documentsToCards(!documents.loaded
									? Array(Number(user?.documentCount)).map((_, i) => <Note key={i} />)
									: notesFromDocuments(documents.list))
								}
							</motion.div>
						) : documents.loaded && (
							<>
								{hasNoDocuments ? (
									<motion.div
										initial={{
											y: 100,
										}}
										transition={{
											delay: .3,
											type: 'spring',
											bounce: .5
										}}
										animate={{
											y: 0,
										}}
									>
										<Typography variant="h6" mt="5rem" sx={{ textAlign: 'center' }}>
											{getNoDocumentsMessage()}
										</Typography>
									</motion.div>
								) : (
									(documents.loaded) && (
										<motion.div
											initial={{
												y: 100,
											}}
											transition={{
												delay: .3,
												type: 'spring',
												bounce: .5
											}}
											animate={{
												y: 0,
											}}
										>
											<Typography variant="h6" mt="5rem" sx={{ textAlign: 'center' }}>
												{noneSelected ? <>
													Check one of the boxes above to load documents
												</> : (<>
													No documents matching: "{searchDocRef.current?.value}"
												</>)}
											</Typography>
										</motion.div>
									)
								)}
							</>
						)
					}
				</>
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
							Last Edit: {settingsOpen.document?.lastUpdated?.toUTCString?.()}
						</ListItemText>
					</ListItem>

					<ListItem>
						<ListItemText>
							Created At: {settingsOpen.document?.createdAt?.toUTCString?.()}
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

								if (text.length !== 0 && !/^\s+$/g.test(text)
									&& text.replace(/^\s+|\s+$|\s(?=\s)/gi, '') !== settingsOpen.document?.title) {

									if (!canRename) setCanRename(true)
								} else if (canRename) {
									setCanRename(false)
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