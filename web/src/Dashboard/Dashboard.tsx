import { useContext, useEffect, useState } from 'react'
import { Context } from '../AccountContext'
import './Dashboard.scss'
import { Button, Card, Divider, Skeleton, Typography } from '@mui/material'
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import { motion } from 'framer-motion'
import { useSnackbar } from 'notistack';
import BeenhereIcon from '@mui/icons-material/Beenhere';

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
		const hours = lastUpdated.getHours()

		const lastUpdatedString = lastUpdated.getUTCDate() === today.getUTCDate()
			? `${hours > 12 ? hours - 12 : hours}:${lastUpdated.getMinutes()} ${hours < 12 ? "AM" : "PM"}`
			: `${lastUpdated.getMonth() + 1}/${lastUpdated.getDate()}/${lastUpdated.getFullYear()}`

		return (
			<div className="Dashboard-Note">
				<Typography variant="h6" fontWeight="bold">{e.title}</Typography>
				<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
					<Typography variant="caption" mr="1rem">Last saved {lastUpdatedString}</Typography><BeenhereIcon sx={{ width: '1rem' }} />
				</div>
				<Divider sx={{ marginTop: '1rem', marginBottom: '1rem' }}></Divider>
				<Typography variant="caption" mr="1rem"> {e.content === '' ? 'Empty Document' : trimString(e.content)}</Typography>
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

export default function Dashboard() {
	const user = useContext(Context)
	// [<done loading>, <documents>]
	const [documents, setDocuments] = useState({ loaded: false, list: [] })
	const { enqueueSnackbar, closeSnackbar } = useSnackbar();

	useEffect(() => {
		(async () => {
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
					key: 'LOGIN_fetchdocumentserror',
					action: () => <Button color="secondary" onClick={() => { closeSnackbar('LOGIN_fetchdocumentserror') }}>{"×"}</Button>
				})
			}

			// uncomment these lines to test loading work.
			// setTimeout(() =>
			setDocuments({ loaded: true, list: data })
			// , 5000)
		})()
	}, [])

	return (
		<>
			<motion.div
				className='Dashboard'
				initial={{ width: 0 }}
				animate={{ width: 'inherit' }}
				exit={{ x: window.innerWidth }}
			>
				<Typography variant="h3">{getGreeting()}, {user?.username}</Typography>
				<Typography variant="h6" mt="1rem" ml="1rem"><AlarmOnIcon sx={{ marginRight: '1rem' }} />{getBlurb()}</Typography>
				{(!documents.loaded || documents?.list?.length > 0) &&
					<div className="Dashboard-notes">
						{sanitizeList(!documents.loaded ? Array(Number(user?.documentCount)).fill(<Note />) : notesFromDocuments(documents.list))}
					</div>
				}
			</motion.div>
		</>
	)
}