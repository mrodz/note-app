import { Button, TextareaAutosize } from "@mui/material"
import { useSnackbar } from "notistack"
import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import { Context } from "../AccountContext"
import "./Dashboard.scss"

export default function UserDocument() {
	const user = useContext(Context)

	const params = useParams()
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()
	const [documentContent, setDocumentContent] = useState('')

	useEffect(() => {

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
				setDocumentContent(data.content)
			}
		})()
	}, [closeSnackbar, enqueueSnackbar, user.accountId, user.sessionId, params.id])

	return (
		<div className="Document">
			<div className="Document-tray">
				<div>
					Tray
				</div>
				<textarea className="Document-textarea" placeholder="Empty document" defaultValue={documentContent} />
			</div>
		</div>
	)
}