import { createContext } from 'react';
import { observable, action } from 'mobx';

class Store {
	@observable
	token: string = 'hola!'

	@action
	updateToken(token: string): void {
		this.token = token;
	}
}

const StoreInstance = new Store();
const StoreContext = createContext(StoreInstance);

export { StoreContext, Store };
export default StoreInstance;