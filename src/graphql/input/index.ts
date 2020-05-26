/* 3rd party imports */
import { ValidatorConstraintInterface } from 'class-validator';
import { Container } from 'typedi';

/* 1st party imports */
import { ValidationService, ValidatorClass } from '@/services/validation';

export type ValidatorTuple = [boolean, string | null];
export type Validator = (value: any) => ValidatorTuple;

const metadataKey = Symbol('ValidationCheck');

export const RegisterValidation = () => {
	return <T extends ValidatorClass>(target: T) => {
		const vldSvc: ValidationService = Container.get('validation.service');
		const validationChecks: string[] = Reflect.getMetadata(metadataKey, target);

		class ValidatorClass2 extends target {
			getErrorsForValue(value: any): string[] | null {
				const errors: string[] = [];
				validationChecks.forEach(key => {
					const validator = (this as any)[key] as Validator;
					const [_, error] = validator(value);
					if (error) errors.push(error);
				})
				return errors.length ? errors : null;
			}
		}

		vldSvc.createValidator(ValidatorClass2);
		return target;
	}
}

export const ValidationCheck = () => {
	return <T extends ValidatorClass>(target: any, targetKey: string) => {
		let validationChecks: string[] = Reflect.getMetadata(metadataKey, target);
		if (validationChecks) {
			validationChecks.push(targetKey);
		} else {
			validationChecks = [targetKey];
			Reflect.defineMetadata(metadataKey, validationChecks, target)
		}
	}
}