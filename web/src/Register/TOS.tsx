import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { useState } from "react";

export function TOS() {
	const [open, setOpen] = useState(false)

	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)

	return (
		<Dialog open={open} onClose={() => setOpen(false)}>
			<DialogTitle>
				Terms of Service
			</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Lorem Ipsum
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} autoFocus>
					Agree
				</Button>
				<Button onClick={handleClose}>
					Disagree
				</Button>
			</DialogActions>
		</Dialog>
	)
}