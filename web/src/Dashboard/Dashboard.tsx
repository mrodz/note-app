import { useContext } from 'react'
import { Context } from '../AccountContext'
import './Dashboard.scss'
import { Skeleton, Typography } from '@mui/material';

function getGreeting() {
	const hour = new Date().getHours();
	if (hour >= 19 && hour < 5) return "Good Evening"
	if (hour >= 5 && hour < 12) return "Good Morning"
	if (hour >= 12 && hour < 19) return "Good Afternoon"
}

export default function Dashboard() {
	const user = useContext(Context)

	return (
		<>
			<div className='Dashboard'>
				<Typography variant="h3">{getGreeting()}, {user?.username}</Typography>
				<Skeleton variant="rectangular" width="100%" height="25rem" />
			</div>
		</>
	)
}