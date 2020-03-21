/* Global variables, injected by Webpack at compile-time */

/** Whether the build is a release build */
declare const RELEASE: boolean;

/* File type declarations */

/** Declare types for .sql files as plain text */
declare module '*sql' {
    const content: string;
    export default content;
}