import { Share } from "@mui/icons-material"
import { Button, Dialog, DialogActions, DialogContentText, DialogTitle, TextField } from "@mui/material"
import { useEffect, useRef, useState } from "react"
import { post } from "../App/App"
import { Transition } from "../Dashboard/Dashboard"
import { isUsernameValid } from "../Register/Register"
import "./Document.scss"

export interface IShareButton {
	ownerId: string,
	sessionId: string,
	documentId: string,
	notify: Function
}

export default function ShareButton(props: IShareButton) {
	const [modalOpen, setModalOpen] = useState(false)
	const [canSend, setCanSend] = useState(null)

	const shareRef = useRef(null)

	const openModal = () => setModalOpen(true)
	const closeModal = () => setModalOpen(false)

	useEffect(() => {
		console.log(shareRef.current?.value)
	}, [shareRef.current?.value])

	const shareDocument = async () => {
		const response = await post.to('/doc/share').send({
			userId: props.ownerId,
			documentId: props.documentId,
			sessionId: props.sessionId,
			guestUsername: shareRef.current.value
		})

		if (response.ok) {
			setModalOpen(false)

			await props?.notify?.()
		}
	}

	return (
		<>
			<Button variant="contained" className="ShareButton" onClick={openModal}>
				<Share sx={{ marginRight: '1rem' }} />
				Share
			</Button>

			<Dialog TransitionComponent={Transition} maxWidth="xs" fullWidth open={modalOpen} onClose={closeModal}>
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