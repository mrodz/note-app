import { Button, Typography } from "@mui/material"
import { useSnackbar } from "notistack"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { Context } from "../AccountContext"
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import "./Document.scss"

function AccessDenied() {
	return (
		<div className="Document-AccessDenied">
			<DoNotTouchIcon sx={{ fontSize: '150pt' }} htmlColor="#abb0ac" />
			<Typography variant="h3">Whoops! Nothing to see here.</Typography>
			<Typography variant="h6">You lack access to this document.</Typography>

		</div>
	)
}

export default function UserDocument() {
	const user = useContext(Context)

	const params = useParams()
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()
	const [documentContent, setDocumentContent] = useState('')
	const [error, setError] = useState<any>({})
	const navigate = useNavigate()

	useEffect(() => {
		if (!user?.sessionId) {
			navigate(`/login?next=/d/${params.id}`)
			return
		};

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
			} else {
				setError(data)
			}
		})()
	}, [closeSnackbar, enqueueSnackbar, user?.accountId, user?.sessionId, params?.id])

	const l = (a) => {
		return a
	}

	return (
		<>
			{user?.sessionId ? (
				<>{
					!('name' in error) ? (
						<div className="Document">

							<div className="Document-tray">
								<div>
									Tray
								</div>
								<textarea className="Document-textarea" placeholder="Empty document" defaultValue={documentContent} />
							</div>
						</div>
					) : <AccessDenied />
				}</>
			) : "Please sign in."}
		</>
	)
}