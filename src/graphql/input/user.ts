/* 3rd party imports */
import { InputType } from 'type-graphql';

/* 1st party imports - GraphQL types */
import { UserDetails } from '@/graphql/types/user';

@InputType()
export class UserDetailsInput implements Partial<UserDetails> {
    email: string;
    real_name: string;
}