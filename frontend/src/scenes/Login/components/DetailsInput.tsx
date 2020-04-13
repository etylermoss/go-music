/* 3rd party imports */
import React from 'react';

/* 1st party imports */
import { DetailsValidation } from '@G/validation';

interface Valid {
	(valid: boolean): any;
}

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
	validation: DetailsValidation;
	/** Function to be called upon onChange, the input text validity is
	 *  passed through (as a boolean).
	 */
	valid?: Valid;
	/** Placed below the input element to provide an explanation to the user
	 *  (e.g "Only use letters and numbers")
	 */
	children?: React.ReactNode;
}

/** Extension of <input> that adds warnings on invalid input, and an explanation element */
const Component = (props: Props): JSX.Element => {
	const { validation, valid, onChange, children, ...inputProps } = props; 

	// May not be needed if invalid length is reported same way as invalid symbols.
	inputProps.minLength = validation.minLength ? validation.minLength : undefined;
	inputProps.maxLength = validation.maxLength ? validation.maxLength : undefined;

	const checkValid = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const invalidChars = event.target.value.match(validation.regex);
		const validLength = event.target.value.length >= validation.minLength && event.target.value.length <= validation.maxLength;
		const isValid = validLength && !invalidChars ? true : false;

		if (valid) valid(isValid);
		if (onChange) onChange(event);
	};

	return (
		<div>
			<input onChange={event => checkValid(event)} {...inputProps}></input>
			{/*Error: invalid value, */}
			{children}
		</div>
	);
};

export default Component;