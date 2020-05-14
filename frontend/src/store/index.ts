/* 3rd party imports */
import { createContext } from 'react';
import { observable, action } from 'mobx';

interface User {
	user_id: string;
	username: string;
	details: UserDetails;
}

interface UserDetails {
	email: string;
	real_name: string;
}

class Store {
	@observable
	user: User | null = null;

	@action
	updateUser(user: User | null): void {
		this.user = user;
	}
}

const StoreInstance = new Store();
const StoreContext = createContext(StoreInstance);

export { StoreContext, Store };
export default StoreInstance;