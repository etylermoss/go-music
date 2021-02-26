/* 3rd party imports */
import { createContext } from 'react';
import { observable, action, computed } from 'mobx';

interface User {
	userID: string;
	username: string;
	adminPriority: number | null;
	details: UserDetails | null;
}

interface UserDetails {
	email: string;
	realName: string;
}

class Store {
	@observable
	user: User | null = null;

	@action
	updateUser(user: User | null): void {
		this.user = user;
	}

	@computed
	get isLoggedIn(): boolean {
		return this.user ? true : false;
	}
}

const StoreInstance = new Store();
const StoreContext = createContext(StoreInstance);

export { StoreContext, Store };
export default StoreInstance;