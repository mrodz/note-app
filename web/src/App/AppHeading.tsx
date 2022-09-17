import { Avatar, IconButton, Menu, Tooltip } from "@mui/material"
import React, { FC } from "react"
import { LocalStorageSessionInfo } from "../AccountContext"
import LogoutButton from "./LogoutButton"

function stringToColor(string: string) {
	let hash = 0
	let i

	/* eslint-disable no-bitwise */
	for (i = 0; i < string.length; i += 1) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash)
	}

	let color = '#'

	for (i = 0; i < 3; i += 1) {
		const value = (hash >> (i * 8)) & 0xff
		color += `00${value.toString(16)}`.slice(-2)
	}
	/* eslint-enable no-bitwise */

	return color
}

function stringAvatar(name: string) {
	return {
		sx: {
			bgcolor: !!name ? stringToColor(name) : '#e0e0e0',
			color: '#000'
		},
		children: !!name ? (name[0] + name[1]).toUpperCase() : ''
	}
}

export interface IAppHeading {
	location: string,
	locations: {
		[pathname: string]: boolean
	},
	bgColor: string,
	user: LocalStorageSessionInfo
}

type avatarFromUsernameConfig = {
	key?: number,
	tooltip?: boolean
}

export const avatarFromUsername = (username: string, config?: avatarFromUsernameConfig) => {
	const avatar = <Avatar {...(!!config?.tooltip || config?.key === undefined) ? {} : { key: config.key }} {...stringAvatar(username)} />

	if (config?.tooltip) return (
		<Tooltip {...config?.key === undefined ? {} : { key: config.key }} title={username} arrow>
			{avatar}
		</Tooltip>
	)

	return avatar
}

const AppHeading: FC<IAppHeading> = (props) => {
	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
	const open = Boolean(anchorEl)
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}
	const handleClose = () => {
		setAnchorEl(null)
	}

	return (
		<>
			{props?.location in props?.locations && (
				<>
					<header className='App-header' style={{ backgroundColor: props.bgColor }}>
						<Tooltip title="Account settings">
							<span>
								<IconButton
									disabled={!props.user?.username}
									onClick={handleClick}
									size="small"
									sx={{ ml: 2 }}
									aria-controls={open ? 'account-menu' : undefined}
									aria-haspopup="true"
									aria-expanded={open ? 'true' : undefined}
								>
									{avatarFromUsername(props.user?.username)}
								</IconButton>
							</span>
						</Tooltip>
					</header>
					<Menu
						anchorEl={anchorEl}
						id="account-menu"
						open={open}
						onClose={handleClose}
						onClick={handleClose}
					>
						<div style={{ paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
							<div>Hello, <strong>@{props.user?.username}</strong></div>
							<LogoutButton />
						</div>
					</Menu>
				</>
			)}
		</>
	)
}

export default AppHeading