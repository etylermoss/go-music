/** @jsx jsx */
/* 3rd party imports */
import { jsx, Flex } from 'theme-ui';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

/* 1st party imports */
import Styles from '@/components/TextInput/styles';

interface TextInputIconProps {
	icon?: FontAwesomeIconProps['icon'];
	placeholder?: string;
	value: string;
	setValue: (newValue: string) => any;
	submit: (event: React.FormEvent<HTMLFormElement>) => any;
}

const Component = ({icon, placeholder, value, setValue, submit}: TextInputIconProps): JSX.Element => {	
	return (
		<form onSubmit={submit}>
			<Flex sx={Styles.root}>
				{icon && <button sx={Styles.button} type="submit">
					<FontAwesomeIcon icon={icon}/>
				</button>}
				<input sx={Styles.input} type="text" placeholder={placeholder ?? ''} 
					value={value}
					onChange={evt => setValue(evt.target.value)}
				/>
			</Flex>
		</form>
	);
};

export default Component;