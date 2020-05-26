/* 3rd party imports */
import { Service } from 'typedi';
import { ValidatorConstraintInterface } from 'class-validator';

export type ValidatorClass = new (...args: any[]) => ValidatorConstraintInterface;

interface Validator {
	name: string;
	instance: ValidatorConstraintInterface;
}

@Service('validation.service')
export class ValidationService {

	private validators: Validator[];

	createValidator(validator: ValidatorClass): void {
		if (!this.validators.find(existingValidator => existingValidator.name === validator.name)) {
			throw new Error('Validator by the same name already registered.');
		}
		this.validators.push({
			name: validator.name,
			instance: new validator(),
		});
	}

	async isValid(validatorName: string, value: any): Promise<boolean> {
		const validator = this.validators.find(validator => validator.name === validatorName).instance;
		if (validator) {
			return validator.validate(value);
		}
		throw new Error('Incorrect Validator name.');
	}
}