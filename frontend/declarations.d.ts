/* Global variables, injected by Webpack at compile-time */

/** Whether running with the Webpack Development Server */
declare const DEVSERVER: boolean;

/** Declaration for @theme-ui/color since it doesn't have a @types package yet */
declare module "@theme-ui/color" {
    /**
     * Get color from theme.colors
     */
    export const getColor: (theme: any, color: string) => any;
    /**
     * Darken a color by an amount 0–1
     */
    export const darken: (c: string, n: number) => (t: any) => any;
    /**
     * Lighten a color by an amount 0–1
     */
    export const lighten: (c: string, n: number) => (t: any) => any;
    /**
     * Rotate the hue of a color by an amount 0–360
     */
    export const rotate: (c: string, d: number) => (t: any) => any;
    /**
     * Set the hue of a color to a degree 0–360
     */
    export const hue: (c: string, h: number) => (t: any) => any;
    /**
     * Set the saturation of a color to an amount 0–1
     */
    export const saturation: (c: string, s: number) => (t: any) => any;
    /**
     * Set the lightness of a color to an amount 0–1
     */
    export const lightness: (c: string, l: number) => (t: any) => any;
    /**
     * Desaturate a color by an amount 0–1
     */
    export const desaturate: (c: string, n: number) => (t: any) => any;
    /**
     * Saturate a color by an amount 0–1
     */
    export const saturate: (c: string, n: number) => (t: any) => any;
    /**
     * Shade a color by an amount 0–1
     */
    export const shade: (c: string, n: number) => (t: any) => any;
    /**
     * Tint a color by an amount 0–1
     */
    export const tint: (c: string, n: number) => (t: any) => any;
    export const transparentize: (c: string, n: number) => (t: any) => any;
    /**
     * Set the transparency of a color to an amount 0-1
     */
    export const alpha: (c: string, n: number) => (t: any) => any;
    /**
     * Mix two colors by a specific ratio
     */
    export const mix: (a: string, b: string, n?: number) => (t: any) => any;
    /**
     * Get the complement of a color
     */
    export const complement: (c: string) => (t: any) => any;
    /**
     * Get the inverted color
     */
    export const invert: (c: string) => (t: any) => any;
    /**
     * Desaturate the color to grayscale
     */
    export const grayscale: (c: string) => (t: any) => any;
  }