import { useContext } from 'react'
import { Context } from '../AccountContext'
import { Navigate } from 'react-router-dom';
import './Dashboard.scss'

export default function Dashboard() {
	const user = useContext(Context);

	return (
		<>
			{!user?.sessionId && <Navigate replace to="/login" />}
			<div className='Dashboard'>
				Hello
			</div>
		</>
	)
}