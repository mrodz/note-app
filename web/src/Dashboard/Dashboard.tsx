import React, { useContext } from 'react'
import { Context } from '../AccountContext'
import './Dashboard.scss'
import { Skeleton, Typography } from '@mui/material'
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import { motion } from 'framer-motion'

function getGreeting() {
	const hour = new Date().getHours();
	if (hour >= 19 && hour < 5) return "Good Evening"
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

const Note = () => {
	return (
		<div className="Dashboard-Note">
			<Skeleton variant="rectangular" height="10rem"></Skeleton>
			<Skeleton width="70%"></Skeleton>
			<Skeleton width="30%"></Skeleton>
		</div>
	)
}

function sanitizeList(list) {
	return list.map((e, i) => <React.Fragment key={i}>{e}</React.Fragment>)
}

export default function Dashboard() {
	const user = useContext(Context)
	const notes = Array(10).fill(<Note />)

	console.log(notes);

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
				<div className="Dashboard-notes">
					{sanitizeList(notes)}
				</div>
			</motion.div>
		</>
	)
}