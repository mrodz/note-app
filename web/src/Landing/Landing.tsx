import React from "react"
import './Landing.scss'
import { motion } from "framer-motion"
import { Button, Typography } from "@mui/material"
import { Link } from "react-router-dom"

const items = {
	inside: {
		transition: {
			type: "spring",
			bounce: 0,
			duration: 0.7,
			delayChildren: 0.3,
			staggerChildren: 1
		}
	},
	outside: {
		transition: {
			type: "spring",
			bounce: 0,
			duration: 2
		}
	}
}

const item = {
	inside: { opacity: 1, x: 0 },
	outside: { opacity: 0, x: -100 },
}

export default React.memo(() => {
	return (
		<div className="Landing">
			<motion.div
				initial="outside"
				animate="inside"
				variants={items}
			>
				<motion.div variants={item}>
					<Typography variant="h1">
						BumbleDoc
					</Typography>
				</motion.div>
				<motion.div variants={item}>
					<Typography variant="h3">
						A document solution for everyone
					</Typography>
				</motion.div>
				<motion.div variants={{
					inside: {
						opacity: 1
					},
					outside: {
						opacity: 0
					}
				}}>
					<div className="Landing-center-h Landing-dashboardlink">
						<Button href="/dashboard" variant="contained" size="large">Go to dashboard</Button>
					</div>
				</motion.div>
			</motion.div>
		</div>
	)
})