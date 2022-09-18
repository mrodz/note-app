import { Avatar, IconButton, Menu, Tooltip } from "@mui/material"
import React, { FC, memo } from "react"
import { LocalStorageSessionInfo } from "../AccountContext"
import LogoutButton from "./LogoutButton"
import { AnimatePresence, motion } from "framer-motion"
import { LoginTheme } from "./App"

function stringToColor(string: string): {
	bg: string,
	font: string
} {
	if (!string) return {
		bg: '#000',
		font: '#fff'
	}

	let hash = 0
	let i

	/* eslint-disable no-bitwise */
	for (i = 0; i < string.length; i += 1) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash)
	}

	let rgb: string[] = Array(3)

	for (i = 0; i < 3; i += 1) {
		rgb[i] = `00${((hash >> (i * 8)) & 0xff).toString(16)}`.slice(-2)
	}

	console.log(rgb);

	/* eslint-enable no-bitwise */

	return {
		bg: rgb.reduce((prev, c) => prev + c, '#'),
		font: (Number(rgb[0]) * 0.299 + Number(rgb[1]) * 0.587 + Number(rgb[2]) * 0.114) > 186 ? '#000' : '#fff'
	}
}

function stringAvatar(name: string) {
	const { bg, font } = stringToColor(name)
	return {
		sx: {
			bgcolor: !!name ? bg : '#e0e0e0',
			color: font
		},
		children: !!name ? (name[0] + name[1]).toUpperCase() : ''
	}
}

interface IAppHeadingWithLocations extends IAppHeading {
	location: string,
	locations: {
		[pathname: string]: boolean
	},
}

export interface IAppHeading {
	user: LocalStorageSessionInfo
}

type avatarFromUsernameConfig = {
	key?: number,
	tooltip?: boolean,
	style?: React.CSSProperties
}

export const avatarFromUsername = (username: string, config?: avatarFromUsernameConfig) => {
	const avatar = <Avatar {...(!!config?.tooltip || config?.key === undefined) ? {} : { key: config.key }} {...stringAvatar(username)} />

	if (config?.tooltip) return (
		<Tooltip style={config?.style ?? {}} {...config?.key === undefined ? {} : { key: config.key }} title={username ?? 'username'} arrow>
			{avatar}
		</Tooltip>
	)

	return avatar
}

const AppHeading: FC<IAppHeading | IAppHeadingWithLocations> = memo((props) => {
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
			{(!('location' in props) || (props?.location in props?.locations)) && (
				<>
					<motion.header
						className='App-header'
						style={{ backgroundColor: LoginTheme.palette.primary.main }}
						key="app-header"
						initial={{ transform: 'translateY(0px)' }}
						animate={{ transform: 'translateY(0px)' }}
						exit={{ transform: 'translateY(-100px)' }}
					>
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
					</motion.header>
				</>
			)}
		</>
	)
})

export default AppHeading