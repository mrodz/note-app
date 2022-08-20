import { createContext, useEffect, useState } from "react";

export interface LocalStorageSessionInfo {
	username: string,
	accountId: string,
	sessionId: string
}

export function writeToLocalStorage({ username, accountId, sessionId }: LocalStorageSessionInfo) {
	localStorage.setItem('username', username)
	localStorage.setItem('account-id', accountId)
	localStorage.setItem('session-id', sessionId)
}

export function readFromLocalStorage(): LocalStorageSessionInfo {
	return {
		username: localStorage.getItem('username'),
		accountId: localStorage.getItem('account-id'),
		sessionId: localStorage.getItem('session-id'),
	}
}

export const Context = createContext<LocalStorageSessionInfo>({
	username: null,
	accountId: null,
	sessionId: null
})

export function AccountContext(props: { children: any }) {
	const [account, setAccount] = useState<LocalStorageSessionInfo>(readFromLocalStorage())

	useEffect(() => {
		function onAccountLogin(e) {
			writeToLocalStorage(e.detail)
			setAccount(e.detail)
		}

		function onAccountLogout() {
			delete localStorage['username']
			delete localStorage['account-id']
			delete localStorage['session-id']

			setAccount(undefined)
		}

		document.addEventListener('on:account-login', onAccountLogin);
		document.addEventListener('on:account-logout', onAccountLogout);

		return () => {
			document.removeEventListener('on:account-login', onAccountLogin);
			document.removeEventListener('on:account-logout', onAccountLogout);
		}
	}, [])

	return (
		<Context.Provider value={account} >
			{props.children}
		</Context.Provider >
	)
}