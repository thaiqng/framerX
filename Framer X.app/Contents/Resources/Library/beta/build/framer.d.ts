/// <reference types="react" />
import { HTMLMotionProps } from 'framer-motion';
import { List } from 'immutable';
import { ListenerFn } from 'eventemitter3';
import { MotionStyle } from 'framer-motion';
import { MotionTransform } from 'framer-motion';
import { MotionValue } from 'framer-motion';
import { PanInfo } from 'framer-motion';
import * as React from 'react';
import { ReactNode } from 'react';
import { Record } from 'immutable';
import { Transition } from 'framer-motion';

/**
 * Action hooks are picked up by Framer X
 * @param options - object containing action options
 * @returns event handler
 * @beta
 */
export declare type Action<T extends object = {
    [key: string]: any;
}> = (options: T) => ActionHandler;

/** @beta */
export declare type ActionControlDescription<P = any> = NumberControlDescription<P> | EnumControlDescription<P> | BooleanControlDescription<P> | StringControlDescription<P> | ColorControlDescription<P> | FusedNumberControlDescription<P> | SegmentedEnumControlDescription<P> | ImageControlDescription<P> | FileControlDescription<P>;

/** @beta */
export declare type ActionControls<ActionProps = any> = {
    [K in keyof ActionProps]?: ActionControlDescription<Partial<ActionProps>>;
};

/** @beta */
export declare type ActionHandler = (...args: any[]) => void;

/**
 * @beta
 */
export declare interface ActionInfo {
    controls: ActionControls;
    title?: string;
}

declare type ActionMap<State> = {
    [key: string]: (state: State, data?: any) => State;
};

/**
 * Provide a title and controls for an action, used by Framer X
 * @param action - a reference to an {@link Action}
 * @param title - the display title of the action
 * @param controls - the action controls
 * @beta
 */
export declare function addActionControls<T extends object = {
    [key: string]: any;
}>(action: Action<T>, title: string, controls: ActionControls<T>): void;

/**
 * Extends component with property controls
 *
 * ```typescript
 * export const MyComponent = props => <h1>{props.header}</h1>
 *
 * addPropertyControls(MyComponent, {
 *   header:  { type: ControlType.String, title: "Header" },
 * })
 *
 * ```
 * @public
 */
export declare function addPropertyControls<Props = any>(component: React.ComponentType<Props>, propertyControls: PropertyControls<Props>): void;

/* Excluded from this release type: addServerUrlToResourceProps */

/**
 * Creates a Animatable object that can be animated. These objects can be passed into a {@link DeprecatedFrame} instead of a primitive like number
 * and afterwards animated with {@link (animate:function)}.
 * @remarks
 * ```jsx
 * const value = Animatable(0)
 * animate(value, 100)
 * ```
 * @param value - Value to animate
 * @returns Animatable value
 * @public
 * @deprecated Use {@link useMotionValue} instead
 */
export declare function Animatable<Value>(value: Value | Animatable<Value>): Animatable<Value>;

/**
 * @public
 * @deprecated Use {@link useMotionValue} instead
 */
export declare interface Animatable<Value> extends UpdateObserver<Value> {
    /**
     * Get the current value out of this Animatable object
     * @remarks
     * ```jsx
     * const a = Animatable(0)
     * a.get() // returns 0
     * await animate(a, 42)
     * a.get() // returns 42
     * ```
     * @returns Current value
     * @public
     */
    get(): Value;
    /**
     * Set a new value to a animatable object
     * @remarks
     * The passed value can be an Animatable value too
     * ```jsx
     * const a = Animatable(0)
     * const b = Animatable(100)
     * a.set(42)
     * a.get() // returns 42
     * a.set(b)
     * a.get() // returns 100
     * ```
     * @param value - New value to set to the animatable
     * @public
     */
    set(value: Value | Animatable<Value>): void;
    /**
     * @public
     */
    set(value: Value | Animatable<Value>, transaction?: TransactionId): void;
    /* Excluded from this release type: finishTransaction */
}

/**
 * @public
 */
export declare namespace Animatable {
    /* Excluded from this release type: transaction */
    /**
     * @public
     */
    export function getNumber(value: number | Animatable<number> | null | undefined, defaultValue?: number): number;
    /* Excluded from this release type: get */
    /* Excluded from this release type: objectToValues */
}

/** @public */
export declare type AnimatableObject<T> = {
    [K in keyof T]: ToAnimatableOrValue<T[K]>;
};

/**
 * Animate an {@link (Animatable:interface)} value to a new value.
 * @remarks
 * Recommended use is to use convenience functions from the `animate` namespace
 * instead of passing an animator. Only use this for low-level animation tweaking.
 *
 * ```jsx
 * const value = Animatable(0)
 * animate(value, 100)
 *
 * const value = Animatable({x: 0, y: 0})
 * animate(value, {x: 100, y: 100})
 * ```
 *
 * @param from - The animatable value or object to start from
 * @param to - Value to animate to
 * @param animator - Animator class to use.
 * @param options - Animation options
 * @returns Instance of {@link FramerAnimation} that can be used to control the animation
 * @public
 * @deprecated Use the {@link AnimationProps.animate} prop on {@link Frame} instead.
 */
export declare function animate<Value, Options>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, animator?: AnimatorClass<Value, Options>, options?: Partial<Options & AnimationOptions<Value>>): FramerAnimation<Value, Options>;

/**
 * @public
 * @deprecated Use the {@link MotionProps.animate} prop on {@link Frame} instead.
 */
export declare namespace animate {
    /**
     * Animate value with a spring curve
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.spring(value, 100, {tension: 100, friction: 100})
     *
     * animate.spring(value, 100, {dampingRatio: 0.5, duration: 1})
     * ```
     * @param from - Value to animate
     * @param to - Value to animate to
     * @param options - Options for the spring
     * These can be either `tension`, `friction`, `velocity` and `tolerance` _or_ `dampingRatio`, `duration`, `velocity` and `mass`
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function spring<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<SpringOptions & AnimationOptions<Value>>): FramerAnimation<Value, SpringOptions>;
    /**
     * Animate value with a bezier curve
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.bezier(value, 100, {duration: 1, curve: Bezier.EaseIn})
     *
     * animate.bezier(value, 100, {duration: 1, curve: [0.3, 0.1, 0.4, 1]})
     * ```
     * @param from - Value to animate
     * @param to - Value to animate to
     * @param options - Options for the bezier curve
     *
     * - `duration` Duration of the animation
     * - `curve` One of the `Bezier` enum values or an array with 4 control points
     *
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function bezier<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<BezierOptions & AnimationOptions<Value>>): FramerAnimation<Value, BezierOptions>;
    /**
     * Animate value with a linear animation
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.linear(value, 100)
     *
     * animate.linear(value, 100, {duration: 1})
     * ```
     * @param from  - Value to animate
     * @param to - Value to animate to
     * @param options - The options for the animation
     *
     * - `duration` - Duration of the animation
     *
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function linear<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<EaseOptions & AnimationOptions<Value>>): FramerAnimation<Value, BezierOptions>;
    /**
     * Animate value with a ease animation
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.ease(value, 100)
     *
     * animate.ease(value, 100, {duration: 1})
     * ```
     * @param from  - Value to animate
     * @param to - Value to animate to
     * @param options - The options for the animation
     *
     * - `duration` - Duration of the animation
     *
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function ease<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<EaseOptions & AnimationOptions<Value>>): FramerAnimation<Value, BezierOptions>;
    /**
     * Animate value with a ease in animation
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.easeIn(value, 100)
     *
     * animate.easeIn(value, 100, {duration: 1})
     * ```
     * @param from  - Value to animate
     * @param to - Value to animate to
     * @param options - The options for the animation
     *
     * - `duration` - Duration of the animation
     *
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function easeIn<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<EaseOptions & AnimationOptions<Value>>): FramerAnimation<Value, BezierOptions>;
    /**
     * Animate value with a ease out animation
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.easeOut(value, 100)
     *
     * animate.easeOUt(value, 100, {duration: 1})
     * ```
     * @param from  - Value to animate
     * @param to - Value to animate to
     * @param options - The options for the animation
     *
     * - `duration` - Duration of the animation
     *
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function easeOut<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<EaseOptions & AnimationOptions<Value>>): FramerAnimation<Value, BezierOptions>;
    /**
     * Animate value with a ease in out animation
     * @remarks
     * ```jsx
     * const value = Animatable(0)
     * animate.easeInOut(value, 100)
     *
     * animate.easeInOut(value, 100, {duration: 1})
     * ```
     * @param from  - Value to animate
     * @param to - Value to animate to
     * @param options - The options for the animation
     *
     * - `duration` - Duration of the animation
     *
     * @returns Instance of {@link FramerAnimation} that can be used to control the animation
     * @deprecated Use {@link MotionProps.animate} on {@link Frame} instead.
     */
    export function easeInOut<Value>(from: Animatable<Value> | AnimatableObject<Value>, to: Value, options?: Partial<EaseOptions & AnimationOptions<Value>>): FramerAnimation<Value, BezierOptions>;
}

/* Excluded from this release type: AnimationDriver */

/**
 * @public
 */
declare interface AnimationInterface {
    /* Excluded from this release type: play */
    cancel(): void;
    /* Excluded from this release type: finish */
    isFinished(): boolean;
}

/**
 * @deprecated Use {@link FrameProps.transition} instead
 */
declare interface AnimationOptions<Value> extends InterpolationOptions {
    /* Excluded from this release type: customInterpolation */
    /* Excluded from this release type: precalculate */
}

/* Excluded from this release type: Animator */

/**
 * @public
 * @deprecated  Use the `transition` prop instead
 */
declare interface AnimatorClass<Value, Options = any> {
    /* Excluded from this release type: __new */
}

/* Excluded from this release type: AnyInterpolation */

/** @public */
export declare interface ArrayControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.Array;
    propertyControl: FlatControlDescription<P>;
    maxCount?: number;
    defaultValue?: any[];
}

/**
 * @beta
 */
declare type Axis = "x" | "y";

declare type Background = Color | Gradient | BackgroundImage | MotionValue<string> | string;

declare interface BackgroundFilterProperties {
    backgroundBlur: number;
}

declare interface BackgroundImage {
    src: string;
    pixelWidth?: number;
    pixelHeight?: number;
    intrinsicWidth?: number;
    intrinsicHeight?: number;
    fit?: ImageFit;
}

declare namespace BackgroundImage {
    const isImageObject: (image: any) => image is object & BackgroundImage;
}

/** @public */
export declare interface BackgroundProperties {
    /**
     * Set the background of a `Frame`. Supports color strings, color objects and images by using `src`. Set to a semi-transparent blue color by default.
     * This will override the values set by the `image` property. To use a color and a image, use `backgroundColor` instead
     * ```jsx
     * <Frame background="#09F"/>
     * <Frame background={Color({r: 255, g: 0, b: 102})} />
     * <Frame background={{ alpha: 1, angle: 75, start: "#09F", end: "#F09"}} />
     * <Frame background={{ src: "https://example.com/logo.png"}} />
     * ```
     * @public
     */
    background: Background | null;
    /**
     * Set the background color of a `Frame`. Supports color strings and objects. Use this property to set a background color alongside the `image` property.
     * ```jsx
     * <Frame backgroundColor="#09F"/>
     * <Frame backgroundColor={Color({r: 255, g: 0, b: 102})} />
     * ```
     * @public
     */
    backgroundColor: string | Color;
    /**
     * Sets a background image of a `Frame`. Will wrap the passed value in a `url('')` if needed.
     * @remarks
     * ```jsx
     * <Frame image="https://source.unsplash.com/random" />
     * ```
     * @public
     */
    image: string;
}

declare interface BaseControlDescription<P = any> {
    title?: string;
    hidden?(props: P): boolean;
}

/**
 * @remarks do no use separately from FrameProps
 * @public
 * */
export declare interface BaseFrameProps {
    /**
     * Add a name to the Frame. This property does not change the behaviour of a Frame, but makes it easier to identify it in your code.
     * @remarks
     * The name will be rendered in the `data-framer-name` attribute of the outputted div, so the Frame is recognizable in the HTML DOM too.
     * ```jsx
     * <Frame name={"Button"} />
     * ```
     * @public
     */
    name: string;
    /* Excluded from this release type: _border */
    /* Excluded from this release type: _initialStyle */
    /* Excluded from this release type: _overrideForwardingDescription */
}

/**
 * @public
 */
declare enum Bezier {
    Linear = "linear",
    Ease = "ease",
    EaseIn = "ease-in",
    EaseOut = "ease-out",
    EaseInOut = "ease-in-out"
}

/* Excluded from this release type: BezierAnimator */

declare interface BezierOptions {
    curve: Curve;
    duration: number;
}

declare type BlendingMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity";

declare interface BlendingProperties {
    blendingMode: BlendingMode;
}

/** @public */
export declare interface BooleanControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.Boolean;
    defaultValue?: boolean;
    disabledTitle?: string;
    enabledTitle?: string;
}

declare type BorderProperties = {
    borderWidth: number | Partial<{
        top: number;
        bottom: number;
        left: number;
        right: number;
    }>;
    borderColor: string;
    borderStyle: BorderStyle;
    border?: string | MotionValue<string>;
};

declare type BorderStyle = "solid" | "dashed" | "dotted" | "double";

declare type BoundActionMap<State, Actions extends ActionMap<State>> = {
    [K in keyof Actions]: (data?: Parameters<Actions[K]>[1]) => void;
};

declare interface BoxShadow {
    inset: boolean;
    color: string;
    x: number;
    y: number;
    blur: number;
    spread: number;
}

declare namespace BoxShadow {
    function is(shadow: any): shadow is BoxShadow;
    function toCSS(shadow: BoxShadow): string;
}

declare interface BoxShadowProperties {
    shadows: BoxShadow[];
}

/* Excluded from this release type: calcChildLayoutRects */

/** @public */
export declare type Cancel = () => void;

/* Excluded from this release type: CanvasStore */

declare interface Change<Value> {
    value: Value;
    oldValue?: Value;
}

/**
 * The Color function can be used to define colors, either as a string value or as an object. All colors
 * are converted to a Color object with `r, g, b`, `h, s, l` and an `a` value.
 * There are also various helpers on the Color function for working with,
 * modifying and detecting colors.
 *
 * ```jsx
 * // HEX
 * const blue = Color("#0099FF")
 *
 * // RGB
 * const blue = Color("rgb(0, 153, 255)")
 * const blue = Color(0, 153, 255)
 * const blue = Color({r: 0, g: 153, b: 255})
 * const blue = Color({r: 0, g: 153, b: 255, a: 1})
 *
 * // HSL
 * const blue = Color("hsl(204, 100%, 50%)")
 * const blue = Color({h: 204, s: 1, l: 0.5})
 * const blue = Color({h: 204, s: 1, l: 0.5, a: 1})
 * ```
 * @public
 */
export declare function Color(color: IncomingColor | Color | number, r?: number, g?: number, b?: number): Color;

/**
 * @public
 */
export declare interface Color {
    r: number;
    g: number;
    b: number;
    h: number;
    s: number;
    l: number;
    a: number;
    roundA: number;
    format: ColorFormat;
    initialValue?: string;
    isValid?: boolean;
    mix: Mixer | MixerStateful;
    toValue: () => string;
}

/**
 * @public
 */
export declare namespace Color {
    /**
     * Formats a Color object into a readable string for debugging.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.inspect(blue)
     * ```
     *
     * @param color - The Color object to format
     * @param initialValue - A canonical hex string to be used instead of an rgba() value.
     */
    export function inspect(color: Color, initialValue?: string): string;
    /**
     * Checks if the value is a valid color object or color string. Returns true or false.
     *
     * @remarks
     * ```jsx
     * Color.isColor("#0099FF") // true
     * Color.isColor(Color("#0099FF")) // true
     * ```
     *
     * @param color - The potential color value to validate
     */
    export function isColor(color: string | Color): boolean;
    /**
     * Checks if the value is a valid color string. Returns true or false.
     *
     * @remarks
     * ```jsx
     * Color.isColorString("#0099FF") // true
     * ```
     *
     * @param color - A string representing a color
     */
    export function isColorString(colorString: string | object): boolean;
    /**
     * Checks if the value is a valid Color object. Returns true or false.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.isColorObject(blue) // true
     * Color.isColorObject("#0099FF") // false
     * ```
     *
     * @param color - An object representing a color.
     */
    export function isColorObject(color: any): color is object & Color;
    /**
     * Formats a Color instance into an RGB string.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toString(blue) // "rgb(0, 153, 255)"
     * ```
     *
     * @param color - The color to format
     */
    export function toString(color: Color): string;
    /**
     * Formats a Color instance into an hexidecimal value.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHex(blue) // "0099FF"
     * Color.toHex(Color("#FFAAFF"), true) // "FAF"
     * ```
     *
     * @param color - The color to format
     * @param allow3Char - If true will return short hand colors if possible (defaults to false).
     */
    export function toHex(color: Color, allow3Char?: boolean): string;
    /**
     * Formats a Color instance into an hexidecimal string.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHexString(blue) // "#0099FF"
     * Color.toHexString(Color("#FFAAFF"), true) // "#FAF"
     * ```
     *
     * @param color - The color to format
     * @param allow3Char - If true will return short hand colors if possible (defaults to false).
     */
    export function toHexString(color: Color, allow3Char?: boolean): string;
    /**
     * Formats a Color instance into an RGB string.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toRgbString(blue) // "rgb(0, 153, 255)"
     * ```
     *
     * @param color - The color to format
     */
    export function toRgbString(color: Color): string;
    /**
     * Formats a Color instance into an HUSL object.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHusl(blue) // {h: 250, s: 100, l: 50, a: 1}
     * ```
     *
     * @param color - The color to format
     */
    export function toHusl(color: Color): ColorHSLA;
    /**
     * Formats a Color instance into an HSL string.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHslString(blue) // "hsl(204, 100%, 50%)"
     * ```
     *
     * @param color - The color to format
     */
    export function toHslString(color: Color): string;
    /**
     * Formats a Color instance into an HSV object.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHsv(blue) // {h: 204, s: 1, v: 1, a: 1}"
     * ```
     *
     * @param color - The color to format
     */
    export function toHsv(color: Color): ColorHSVA;
    /**
     * Formats a Color instance into an HSV string.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHslString(blue) // "hsv(204, 100%, 50%)"
     * ```
     *
     * @param color - The color to format
     */
    export function toHsvString(color: Color): string;
    /**
     * Formats a Color instance into {@link https://css-tricks.com/snippets/css/named-colors-and-hex-equivalents/ | CSS name}
     * or returns false if unspecified.
     *
     * @remarks
     * ```jsx
     * const green = Color("#8FBC8F")
     *
     * Color.toName(green) // "darkseagreen"
     * ```
     *
     * @param color - The color to format
     */
    export function toName(color: Color): string | false;
    /**
     * Formats a color into an HSL object.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toHsl(blue) // {h: 204, s: 1, l: 0.5, a: 1}
     * ```
     *
     * @param color - The color to format
     */
    export function toHsl(color: Color): ColorHSLA;
    /**
     * Formats a color into an RGB object.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * Color.toRgb(blue) // {r: 40, g: 175, b: 250, a: 1}
     * ```
     *
     * @param color - The color to format
     */
    export function toRgb(color: Color): ColorRGBA;
    /**
     * Returns a brightened color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const brightblue = Color.lighten(blue, 20)
     * ```
     *
     * @param color - The color to brighten
     * @param amount - A number, from 0 to 100. Set to 10 by default.
     */
    export function brighten(color: Color, amount?: number): Color;
    /**
     * Add white and return a lightened color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const lightblue = Color.lighten(blue, 20)
     * ```
     *
     * @param color - The color to lighten
     * @param amount - A number, from 0 to 100. Set to 10 by default.
     */
    export function lighten(color: Color, amount?: number): Color;
    /**
     * Add black and return a darkened color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const darkblue = Color.darken(blue, 20)
     * ```
     * @param color - The color to darken.
     * @param amount - A number, from 0 to 100. Set to 10 by default.
     */
    export function darken(color: Color, amount?: number): Color;
    /**
     * Increase the saturation of a color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const saturated = Color.saturate(blue, 100)
     * ```
     * @param color - The color to modify
     * @param amount - A number from 0 to 100. Set to 10 by default.
     */
    export function saturate(color: Color, amount?: number): Color;
    /**
     * Decrease the saturation of a color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const desaturated = Color.desaturate(blue, 100)
     * ```
     * @param color - The color to modify
     * @param amount - A number from 0 to 100. Set to 10 by default.
     */
    export function desaturate(color: Color, amount?: number): Color;
    /**
     * Return a fully desaturated color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const gray = Color.grayscale(blue)
     * ```
     * @param color - The color to convert.
     */
    export function grayscale(color: Color): Color;
    /**
     * Returns a new color for the rotated hue.
     * @param color - The color to manipulate
     * @param angle - The angle in degrees in which to rotate the hue.
     */
    export function hueRotate(color: Color, angle: number): Color;
    /**
     * Set the alpha value, also known as opacity, of the color.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * const transparent = Color.alpha(blue, 0.1)
     * ```
     * @param color - The original color to modify.
     * @param alpha - A number from 1 to 0. Set to 1 by default.
     */
    export function alpha(color: Color, a?: number): Color;
    /**
     * Set the alpha value, also known as opacity, of the color to zero.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     *
     * const transparent = Color.alpha(blue)
     * ```
     * @param color - The original color to modify.
     */
    export function transparent(color: Color): Color;
    /**
     * Change the alpha value, also know as opacity, by a multiplier.
     *
     * @remarks
     * ```jsx
     * const blue = Color("#0099FF")
     * const transparent = Color.multiplyAlpha(blue, 0.5)
     * ```
     * @param color - The original color to modify.
     * @param alphaValue - A number between 1 and 0, defaults to 1,
     */
    export function multiplyAlpha(color: Color, alphaValue?: number): Color;
    /**
     * Returns a function that can be used to transition a color from one value
     * to another. By default this will use the RGB `mix` model. Useful for providing to animation tools.
     *
     * ```jsx
     * const blend = Color.interpolate(Color("red"), Color("blue"))
     *
     * blend(0)   // Initial state (red)
     * blend(0.5) // Mid state (purple)
     * blend(1)   // Final state (blue)
     * ```
     * @param colorA - The starting color
     * @param colorB - The final color
     * @param model  - The model to use for the mix. One of {@link ColorMixModelType}
     */
    export function interpolate(colorA: Color, colorB: Color, model?: ColorMixModelType): (progress: number) => Color;
    /**
     * Create a function that will mix two colors together and output the result as an rgb string.
     *
     * @param colorA - The starting color
     * @param colorB - The final color
     * @param options - Options for the color mixer
     *
     * - `model`: The model to use for the mix. One of {@link ColorMixModelType}
     *
     * @public
     */
    export function mix(from: Color, toColor: Color, { model }?: {
        model?: ColorMixModelType | undefined;
    }): (p: number) => string;
    /**
     * Blend two colors together, optionally based on user input. The fraction defines the
     * distribution between the two colors, and is set to 0.5 by default.
     * The `limit` defines if the color can transition beyond its range.
     * @remarks
     * ```jsx
     * // Mix red with yellow
     * const orange = Color.mix("red", "yellow", 0.5)
     * ```
     *
     * ```jsx
     * Color.mix("red", "yellow", 0.5, true, "husl")
     * ```
     *
     * @param colorA   - A color, the first one.
     * @param colorB   - A color, the second one.
     * @param fraction - An optional number, from 0 to 1, set to 0.5 by default.
     * @param limit    - An optional boolean, set to false by default.
     * @param model    - The model to use for the mix. One of {@link ColorMixModelType}
     */
    export function mixAsColor(colorA: Color, colorB: Color, fraction?: number, limit?: boolean, model?: ColorMixModelType): Color | null;
    /**
     * Returns a Color instance with a random color value set.
     *
     * @remarks
     * ```jsx
     * const random = Color.random()
     * ```
     *
     * @param alphaValue - An optional alpha value, set to 1 by default.
     */
    export function random(alphaValue?: number): Color;
    /**
     * Creates a greyscale color.
     *
     * @remarks
     * ```jsx
     * const gray = Color.gray(0.5)
     * ```
     *
     * @param amount - A number from 0 to 1 representing the amount of white.
     * @param alphaValue  - A number from 0 to 1 representing the alpha. Set to 1 by default.
     */
    export function grey(amount?: number, alphaValue?: number): Color;
    /* Excluded from this release type: gray */
    /* Excluded from this release type: rgbToHsl */
    /* Excluded from this release type: isValidColorProperty */
    /**
     * Calculates the color difference using {@link https://en.wikipedia.org/wiki/Color_difference#Euclidean |
     * Euclidean distance fitting human perception}. Returns a value between 0 and 765
     * @param colorA - A first color.
     * @param colorB - A second color.
     */
    export function difference(colorA: Color, colorB: Color): number;
    /**
     * Checks whether two Color objects are equal.
     *
     * @remarks
     * ```jsx
     * Color.equal(Color("red"), Color("red"))  // true
     * Color.equal(Color("red"), Color("blue")) // false
     *
     * Color.equal(Color("#0099FF"), Color("009AFF"))    // false
     * Color.equal(Color("#0099FF"), Color("009AFF"), 2) // true
     * ```
     *
     * @param colorA    - The first color
     * @param colorB    - The second color
     * @param tolerance - A tolerance for the difference between rgba values. Set to 0.1 by default.
     */
    export function equal(colorA: Color, colorB: Color, tolerance?: number): boolean;
}

/** @public */
export declare interface ColorControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.Color;
    defaultValue?: string;
}

declare enum ColorFormat {
    RGB = "rgb",
    HSL = "hsl",
    HSV = "hsv",
    HEX = "hex",
    NAME = "name"
}

declare interface ColorHSL {
    h: number;
    s: number;
    l: number;
}

declare type ColorHSLA = ColorHSL & {
    a: number;
};

declare interface ColorHSV {
    h: number;
    s: number;
    v: number;
}

declare type ColorHSVA = ColorHSV & {
    a: number;
};

/**
 * Various Color functions, such as {@link (Color:namespace).mix} and {@link
 * (Color:namespace).interpolate}, take an optional color model that
 * determines how two colors are mixed together.
 *
 * @remarks
 *
 * ```javascript
 * const newColor = Color.mix(Color("red"), Color("blue"), {model: ColorMixModelType.HSL})
 * ```
 *
 * @public
 */
export declare enum ColorMixModelType {
    /**
     * Use the {@link https://en.wikipedia.org/wiki/RGB_color_model | RGB color space} without an alpha value
     *
     * @remarks
     *
     * ```javascript
     * const newColor = Color.mix(Color("red"), Color("blue"), {model: ColorMixModelType.RGB})
     * ```
     *
     * @public
     */
    RGB = "rgb",
    /**
     * Use the {@link https://en.wikipedia.org/wiki/RGB_color_model | RGB color space} color space with an alpha value
     *
     * @remarks
     *
     * ```javascript
     * const newColor = Color.mix(Color("red"), Color("blue"), {model: ColorMixModelType.RGBA})
     * ```
     *
     * @public
     */
    RGBA = "rgba",
    /**
     * Use the {@link https://en.wikipedia.org/wiki/HSL_and_HSV | HSL} color space with an alpha value
     *
     * @remarks
     *
     * ```javascript
     * const newColor = Color.mix(Color("red"), Color("blue"), {model: ColorMixModelType.HSL})
     * ```
     *
     * @public
     */
    HSL = "hsl",
    /**
     * Use the {@link https://en.wikipedia.org/wiki/HSL_and_HSV | HSL} color space with an alpha value
     *
     * @remarks
     *
     * ```javascript
     * const newColor = Color.mix(Color("red"), Color("blue"), {model: ColorMixModelType.HSLA})
     * ```
     *
     * @public
     */
    HSLA = "hsla",
    /**
     * Use the {@link http://www.hsluv.org | HSLuv } human friendly color model
     *
     * @remarks
     *
     * ```javascript
     * const newColor = Color.mix(Color("red"), Color("blue"), {model: ColorMixModelType.HUSL})
     * ```
     *
     * @public
     */
    HUSL = "husl"
}

declare interface ColorMixOptions {
    model?: ColorMixModelType;
}

declare interface ColorRGB {
    r: number;
    g: number;
    b: number;
}

declare type ColorRGBA = ColorRGB & {
    a: number;
};

/* Excluded from this release type: ComponentContainer */

/* Excluded from this release type: ComponentContainerProperties */

/* Excluded from this release type: ComponentContainerProps */

/* Excluded from this release type: ComponentContainerState */

/* Excluded from this release type: ComponentDefinition */

/* Excluded from this release type: ComponentIdentifier */

/** @public */
declare interface ComponentInstanceDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.ComponentInstance;
}

/* Excluded from this release type: ComponentLoader */

/* Excluded from this release type: componentLoader */

/* Excluded from this release type: ComponentType */

declare type ConstraintAuto = "auto";

declare interface ConstraintConfiguration {
    /* Excluded from this release type: _constraints */
}

/**
 * Dimensions can be numbers or strings: percentages, fractions of free space (fr), or auto
 * @public
 */
declare type ConstraintDimension = Animatable<number> | number | ConstraintPercentage | ConstraintAuto | ConstraintFreespaceFraction;

declare type ConstraintFreespaceFraction = string;

declare type ConstraintPercentage = string;

/**
 * These properties are used to layout elements within Framer’s constraint system.
 * @internalRemarks Represents model property values for layout constraints. These may be internally inconsistent. Mask and Values are generated from these.
 * @public
 * */
declare interface ConstraintProperties extends Partial<WithFractionOfFreeSpace> {
    /* Excluded from this release type: parentSize */
    /**
     * Pinned position from left
     * @public
     */
    left: Animatable<number> | number | null;
    /**
     * Pinned position from right
     * @public
     */
    right: Animatable<number> | number | null;
    /**
     * Pinned position from top
     * @public
     */
    top: Animatable<number> | number | null;
    /**
     * Pinned position from bottom
     * @public
     */
    bottom: Animatable<number> | number | null;
    /**
     * Center of horizontal position (X axis)
     * @public
     */
    centerX: ConstraintPercentage;
    /**
     * Center of vertical position (Y axis)
     * @public
     */
    centerY: ConstraintPercentage;
    /**
     * Element width
     * @public
     */
    width: ConstraintDimension;
    /**
     * Element height
     * @public
     */
    height: ConstraintDimension;
    /**
     * Aspect Ratio to keep when resizing
     * @public
     */
    aspectRatio: number | null;
    /**
     * //TODO What is autoSize for? Internal?
     * @public
     */
    autoSize?: boolean;
}

/* Excluded from this release type: constraintsEnabled */

/** @public */
export declare type ControlDescription<P = any> = NumberControlDescription<P> | EnumControlDescription<P> | BooleanControlDescription<P> | StringControlDescription<P> | ColorControlDescription<P> | FusedNumberControlDescription<P> | SegmentedEnumControlDescription<P> | ImageControlDescription<P> | FileControlDescription<P> | ComponentInstanceDescription<P> | ArrayControlDescription<P> | EventHandlerControlDescription<P>;

declare type ControlPoints = [number, number, number, number];

/**
 * Used by the {@link PropertyControls} and specifies the type of user interface for receiving
 * input. Each field has a distinct set of properties though they all accept `title` and `hidden`
 * properties.
 *
 * @remarks
 * ```javascript
 * export function MyComponent({ title }) {
 *   return <Frame size={"100%"}>{title}</Frame>
 * }
 *
 * addPropertyControls(MyComponent, {
 *   title: {
 *     type: ControlType.String,
 *     title: "Title",
 *     hidden: (props) => true
 *   },
 * }
 * ```
 * @public
 */
export declare const enum ControlType {
    /**
     * A property control that displays an on / off checkbox. The associated property will be `true` or `false`,
     * depending on the state of the checkbox. Includes an optional `defaultValue`, which is set to `true` by default. You can also customize the labels displayed in the property panel with the `enabledTitle` and `disabledTitle` properties.
     *
     * @remarks
     * ```javascript
     * export function MyComponent(props) {
     *   return <Frame size={"100%"}>{props.showText ? "Hello World" : null}</Frame>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   showText: {
     *     type: ControlType.Boolean,
     *     title: "Show Text",
     *     defaultValue: true,
     *     enabledTitle: "On",
     *     disabledTitle: "Off",
     *   },
     * })
     * ```
     */
    Boolean = "boolean",
    /**
     * A property control that accepts any numeric value. This will be provided directly as a property.
     * Will display an input field with a range slider by default. The
     * `displayStepper` option can be provided to include a stepper control instead.
     *
     * @remarks
     * ```javascript
     * export function MyComponent(props) {
     *   return <Frame rotateZ={props.rotation} size={"100%"}>{rotation}</Frame>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   rotation: {
     *     type: ControlType.Number,
     *     defaultValue: 0,
     *     min: 0,
     *     max: 360,
     *     unit: "deg",
     *     step: 0.1,
     *     displayStepper: true,
     *   },
     * })
     * ```
     */
    Number = "number",
    /**
     * A property control that accepts plain text values. This will be provided directly as a property.
     * Will display an input field with an optional placeholder value.
     * If `obscured` attribute is set to true a password input field will be used instead of a regular text input
     * so that the value in the input will be visually obscured, yet still be available as plain text inside the component
     *
     * @remarks
     * ```javascript
     * export function MyComponent(props) {
     *   return <Frame size={"100%"}>{props.title}</Frame>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   offset: {
     *     type: ControlType.String,
     *     defaultValue: "Framer X",
     *     placeholder: "Type something…",
     *   },
     * }
     * ```
     */
    String = "string",
    /**
     * A property control that can be used to take a single number or four distinct numeric input fields.
     * The typical use case for this control is for visual properties like border, padding or margin.
     * It will display an input field to accept a single value, alongside a segmented control
     * allowing four distinct values to be provided.
     *
     * ```javascript
     * export function MyComponent({
     *   radius = 50,
     *   topLeft,
     *   topRight,
     *   bottomRight,
     *   bottomLeft,
     *   isMixed = false,
     * }) {
     *   const borderRadius = isMixed
     *     ? `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`
     *     : `${radius}px`
     *   return <Frame background={"red"} borderRadius={borderRadius} size={"100%"}></Frame>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   radius: {
     *     type: ControlType.FusedNumber,
     *     title: "Radius",
     *     defaultValue: 50,
     *     toggleKey: "isMixed",
     *     toggleTitles: ["All", "Individual"],
     *     valueKeys: ["topLeft", "topRight", "bottomRight", "bottomLeft"],
     *     valueLabels: ["NW", "NE", "SE", "SW"],
     *     min: 0,
     *   },
     * })
     * ```
     */
    FusedNumber = "fusednumber",
    /**
     * A property control that represents a list of options. The selected option will be provided as a property.
     * This control is displayed as a dropdown menu in which a user can select one of the items.
     *
     * ```javascript
     * export function MyComponent(props) {
     *   const value = props.value || "a"
     *   const colors = { a: "red", b: "green", c: "blue" }
     *   return <Frame background={colors[value]} size={"100%"}>{value}</Frame>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   value: {
     *     type: ControlType.Enum,
     *     defaultValue: "a",
     *     options: ["a", "b", "c"],
     *     optionTitles: ["Option A", "Option B", "Option C"],
     *   },
     * })
     * ```
     */
    Enum = "enum",
    /**
     * A property control that represents a list of option. The selected option will be provided as a property.
     * This control is displayed as a segmented control. Otherwise, it behaves exactly the
     * same as {@link ControlType.Enum}.
     *
     * @remarks
     * ```javascript
     * export function MyComponent(props) {
     *   const value = props.value || "a"
     *   const colors = { a: "red", b: "green", c: "blue" }
     *   return <Frame background={colors[value]} size={"100%"}>{value}</Frame>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   value: {
     *     type: ControlType.SegmentedEnum,
     *     defaultValue: "a",
     *     options: ["a", "b", "c"],
     *     optionTitles: ["A", "B", "C"],
     *   },
     * })
     * ```
     */
    SegmentedEnum = "segmentedenum",
    /**
     * A property control that represents a color value. It will be included in the component props as a string.
     * This control is displayed as a color field and will provide the selected color in either
     * HEX (`"#fff"`) or HSL (`hsla(203, 87%, 50%, 0.5)`) notation, depending on
     * whether there is an alpha channel.
     *
     * @remarks
     * ```javascript
     * function MyComponent(props) {
     *   return <Frame background={props.background} size={"100%"} />
     * }
     *
     * addPropertyControls(MyComponent, {
     *   background: {
     *     type: ControlType.Color,
     *     defaultValue: "#fff",
     *   },
     * })
     * ```
     */
    Color = "color",
    /**
     * A property control that allows the user to pick an image resource. It will
     * be included in the component props as an URL string.
     * Displayed as an image picker with associated file picker. The chosen asset
     * will be provided as a fully qualified URL.
     *
     * @remarks
     * ```jsx
     * function MyComponent(props) {
     *   return <Frame image={props.image} size={"100%"} />
     * }
     *
     * addPropertyControls(MyComponent, {
     *   image: {
     *     type: ControlType.Image,
     *   }
     * })
     * ```
     */
    Image = "image",
    /**
     * A property control that allows the user to pick a file resource. It will be
     * included in the component props as an URL string.
     * Displayed as an file picker that will open a native file browser. The
     * selected file will be provided as a fully qualified URL. The
     * `allowedFileTypes` property must be provided to specify acceptable file
     * types.
     *
     * @remarks
     * ```javascript
     * export function MyComponent(props) {
     *   return (
     *     <Frame size={"100%"}>
     *       <video
     *         style={{ objectFit: "contain", props.width, props.height }}
     *         src={props.filepath}
     *         controls
     *       />
     *     </Frame>
     *   )
     * }
     *
     * addPropertyControls(MyComponent, {
     *   filepath: {
     *     type: ControlType.File,
     *     allowedFileTypes: ["mov"],
     *   },
     * })
     * ```
     */
    File = "file",
    /**
     * A property control that references to another components on the canvas,
     * included in the component props as a React component.
     * The component will have an outlet to allow linking to other Frames.
     * Available Frames will also be displayed in a dropdown menu in the
     * properties panel. The component reference will be provided as a property.
     * As a convention, the name for the property is usually just `children`.
     *
     * Multiple components can be linked by combining the `ComponentInstance`
     * type with the {@link ControlType.Array}.
     *
     * ```javascript
     * export function MyComponent(props) {
     *   return <Stack size={"100%"}>{props.children}</Stack>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   children: {
     *     type: ControlType.ComponentInstance,
     *   },
     * })
     * ```
     */
    ComponentInstance = "componentinstance",
    /**
     * A property control that allows multiple values per `ControlType`, provided as an array via properties.
     * For most control types this will be displayed as an additional
     * section in the properties panel allowing as many fields to be provided
     * as required.
     *
     * For a {@link ControlType.ComponentInstance} the Frame will also gain
     * an additional outlet control on the Canvas that allows links to be created between frames.
     *
     * ```javascript
     * export function MyComponent(props) {
     *   const frames = props.images.map(image => <Frame image={image} width={"1fr"} height={"1fr"} />)
     *   return <Stack size={"100%"}>{frames}</Stack>
     * }
     *
     * addPropertyControls(MyComponent, {
     *   images: {
     *     type: ControlType.Array,
     *     propertyControl: {
     *       type: ControlType.Image
     *     }
     *   },
     *   // Allow up to five items
     *   maxCount: 5,
     * })
     *
     * addPropertyControls(MyComponent, {
     *   children: {
     *     type: ControlType.Array,
     *     propertyControl: {
     *       type: ControlType.ComponentInstance
     *     },
     *     maxCount: 5,
     *   },
     * })
     * ```
     */
    Array = "array",
    /**
     * A property control that represents an event handler.
     *
     * ```javascript
     * function MyComponent(props) {
     *   return <Frame onTap={props.onTap} size={"100%"} />
     * }
     *
     * addPropertyControls(MyComponent, {
     *   onTap: {
     *     type: ControlType.EventHandler,
     *   }
     * })
     * ```
     */
    EventHandler = "eventHandler"
}

/**
 * @beta
 */
export declare namespace ConvertColor {
    export function hueRotate(color: string, angle: number): string;
    export function setAlpha(color: string, alpha: number): string;
    export function getAlpha(color: string): number;
    export function multiplyAlpha(color: string, alpha: number): string;
    export function toHex(color: string): string;
    export function toRgb(color: string): ColorRGBA;
    export function toRgbString(color: string): string;
    export function toHSV(color: string): ColorHSVA;
    export function toHSL(color: string): ColorHSLA;
    export function toHslString(color: string): string;
    export function toHsvString(color: string): string;
    export function hsvToHSLString(hsv: ColorHSV | ColorHSVA): string;
    export function hsvToString(hsv: ColorHSV | ColorHSVA): string;
    export function rgbaToString(color: ColorRGB | ColorRGBA): string;
    export function hslToString(hsl: ColorHSL | ColorHSLA): string;
    export function toColorPickerSquare(h: number): string;
    export function isValid(color: string): boolean;
    export function equals(a: Color | string, b: Color | string): boolean;
    export function toHexOrRgbaString(input: string): string;
}

/* Excluded from this release type: createData */

/* Excluded from this release type: createDesignComponent */

/**
 * @internalremarks do no use separately from FrameProps
 * @public
 * */
export declare interface CSSTransformProperties extends MotionTransform {
    /**
     * Set the CSS transform `translateX` property.
     * @remarks
     * ```jsx
     * <Frame x={100} />
     * ```
     * @public
     */
    x: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `translateY` property.
     * @remarks
     * ```jsx
     * <Frame y={100} />
     * ```
     * @public
     */
    y: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `translateZ` property.
     * @remarks
     * ```jsx
     * <Frame z={100} />
     * ```
     * @public
     */
    z: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `rotate` property in degrees.
     * @remarks
     * ```jsx
     * <Frame rotate={45}/>
     * ```
     * @public
     */
    rotate: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `rotateX` property in degrees.
     * @remarks
     * ```jsx
     * <Frame rotateX={45}/>
     * ```
     * @public
     */
    rotateX: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `rotateY` property in degrees.
     * @remarks
     * ```jsx
     * <Frame rotateY={45}/>
     * ```
     * @public
     */
    rotateY: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `rotateZ` property in degrees.
     * @remarks
     * ```jsx
     * <Frame rotateZ={45}/>
     * ```
     * @public
     */
    rotateZ: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `scale` property.
     * @remarks
     * ```jsx
     * <Frame scale={1.5} />
     * ```
     * @public
     */
    scale: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `scaleX` property.
     * @remarks
     * ```jsx
     * <Frame scaleX={1.5} />
     * ```
     * @public
     */
    scaleX: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `scaleY` property.
     * @remarks
     * ```jsx
     * <Frame scaleY={2} />
     * ```
     * @public
     */
    scaleY: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `skew` property in degrees.
     * @remarks
     * ```jsx
     * <Frame skew={15} />
     * ```
     * @public
     */
    skew: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `skewX` property in degrees.
     * @remarks
     * ```jsx
     * <Frame skewX={15} />
     * ```
     * @public
     */
    skewX: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `skewY` property in degrees.
     * @remarks
     * ```jsx
     * <Frame skewY={15} />
     * ```
     * @public
     */
    skewY: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `originX` property.
     * @remarks
     * ```jsx
     * <Frame originX={0.5} />
     * ```
     * @public
     */
    originX: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `originY` property.
     * @remarks
     * ```jsx
     * <Frame originY={0.5} />
     * ```
     * @public
     */
    originY: number | string | MotionValue<number | string>;
    /**
     * Set the CSS transform `originZ` property. Defaults to `px` units.
     * @remarks
     * ```jsx
     * <Frame originZ={100} />
     * ```
     * @public
     */
    originZ: number | string | MotionValue<number | string>;
    /**
     * Set the CSS perspective property.
     * @remarks
     * ```jsx
     * <Frame perspective={500} />
     * ```
     * @public
     */
    perspective: number | string | MotionValue<number | string>;
}

declare type Curve = ControlPoints | Bezier;

declare interface CustomConstraintProperties {
    /**
     * Aspect Ratio to keep when resizing
     * @public
     */
    aspectRatio?: number | null;
    /**
     * Used for Text and Graphics containers
     * @public
     */
    autoSize?: boolean;
    /**
     * Use Vekter constraint layout system, disable DOM layout
     * @public
     */
    enabled: boolean;
    intrinsicWidth?: number;
    intrinsicHeight?: number;
}

/* Excluded from this release type: CustomProperties */

/* Excluded from this release type: CustomPropertiesContext */

/**
 * Takes a CSS variable and attempts to lookup the value. Useful for retrieving
 * the original value when provided with a variable for animations or manipulation.
 * @returns the value string or null if not found.
 */
declare type CustomPropertiesLookup = (variable: string) => string | null;

declare interface DampingDurationSpringOptions {
    dampingRatio: number;
    duration: number;
    velocity: number;
    mass: number;
}

/**
 * Allows data to be shared between Frames using Code Overrides.
 * Any changes to the `Data` instance will cause the preview to update and code
 * overrides will re-render. In this example, we’re updating the `scale` property on `press`, setting it to `0.5`.
 * ```jsx
 * import { Data, Override } from "framer"
 *
 * const data = Data({
 *    scale: 0.5,
 * })
 *
 * export function WhileTap(): Override {
 *    return {
 *        whileTap: {
 *            scale: data.scale,
 *        },
 *    }
 * }
 *
 * ```
 * @param initial - The initial value of the data to be set.
 * @returns the data object for use across components.
 * @public
 */
export declare function Data<T extends object = object>(initial?: Partial<T> | object): T;

/**
 * @public
 * @internalremarks The release tag on this should be internal, but API extractor does not support that yet: https://github.com/Microsoft/web-build-tools/issues/972
 */
export declare namespace Data {
    /* Excluded from this release type: _stores */
    /* Excluded from this release type: addData */
    /* Excluded from this release type: addObserver */
}

/* Excluded from this release type: DataContext */

declare type DataHook<State, Actions> = (id?: string | Symbol, initialState?: State) => [State, Actions];

/* Excluded from this release type: DataObserver */

/* Excluded from this release type: debounce */

declare const defaultId: unique symbol;

declare interface DeprecatedCoreFrameProps extends DeprecatedFrameProperties, LayerProps {
}

/**
 * @public
 */
export declare class DeprecatedFrame extends Layer<DeprecatedCoreFrameProps, DeprecatedFrameState> {
    static supportsConstraints: boolean;
    static defaultFrameSpecificProps: DeprecatedFrameProperties;
    static readonly defaultProps: DeprecatedCoreFrameProps;
    static rect(props: Partial<ConstraintProperties>): Rect;
    readonly rect: Rect;
    element: HTMLDivElement | null;
    imageDidChange: boolean;
    state: DeprecatedFrameState;
    static getDerivedStateFromProps(nextProps: Partial<DeprecatedCoreFrameProps>, prevState: DeprecatedFrameState): DeprecatedFrameState | null;
    static updatedSize(props: Partial<DeprecatedCoreFrameProps>, state: DeprecatedFrameState): AnimatableObject<Size> | Size;
    getStyle(): React.CSSProperties;
    private updateStyle;
    setElement: (element: HTMLDivElement | null) => void;
    propsObserver: AnimatableObject<DeprecatedCoreFrameProps>;
    propsObserverCancel?: Cancel;
    sizeObserver: AnimatableObject<Size>;
    sizeObserverCancel?: Cancel;
    componentDidMount(): void;
    componentDidUpdate(): void;
    protected onPropsChange: (props: Change<AnimatableObject<DeprecatedCoreFrameProps>>) => void;
    protected onSizeChange: () => void;
    componentWillUnmount(): void;
    /* Excluded from this release type: checkImageAvailability */
    render(): JSX.Element | null;
    layoutChildren(): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>[];
}

/** @public */
export declare interface DeprecatedFrameProperties extends ConstraintProperties, DeprecatedTransformProperties, DeprecatedVisualProperties {
    /**
     * Determines whether the Frame is current visible. Set to `true` by default.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame visible={false} />
     * }
     * ```
     */
    visible: boolean;
    /**
     * An optional name for the Frame.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame name="MyFrame" />
     * }
     * ```
     */
    name?: string;
    /**
     * Set to `true` to enable backface-visibility.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame backfaceVisibility={true} />
     * }
     * ```
     */
    backfaceVisible?: boolean | Animatable<boolean>;
    /**
     * Set the perspective on the z-plane.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame perspective={100px} />
     * }
     * ```
     */
    perspective?: number | Animatable<number>;
    /**
     * Set to `true` to preserve 3D.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame preserve3d={true} />
     * }
     * ```
     */
    preserve3d?: boolean | Animatable<boolean>;
    /**
     * A border width for the frame. Can be either a single number for all sides or
     * an object describing each side. Set to `0` by default.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame borderWidth={{top: 10, bottom: 10}} />
     * }
     * ```
     */
    borderWidth: number | Partial<{
        top: number;
        bottom: number;
        left: number;
        right: number;
    }>;
    /**
     * A border color for the Frame. Set to `"#222"` by default.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame borderColor="red" />
     * }
     * ```
     */
    borderColor: string;
    /**
     * A border style for the Frame. One of `"solid", "dashed", "dotted"` or `"double"`. Set to `"solid"` by default.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame borderStyle="dotted" />
     * }
     * ```
     */
    borderStyle: BorderStyle;
    /**
     * Additional CSSProperties to apply to the frame. Usage is exactly the same as with the
     * standard React style prop.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame style={{color: "red", backgroundColor: "blue"}} />
     * }
     * ```
     */
    style?: React.CSSProperties;
    /**
     * An optional className for the Frame.
     * @remarks
     * ```jsx
     * function App() {
     *   return <Frame className="my-frame" />
     * }
     * ```
     */
    className?: string;
    /* Excluded from this release type: _overrideForwardingDescription */
    /* Excluded from this release type: _initialStyle */
}

declare interface DeprecatedFrameState {
    size: AnimatableObject<Size> | Size | null;
    shouldCheckImageAvailability: boolean;
    currentBackgroundImageSrc: string | null;
}

/** @public */
export declare const DeprecatedFrameWithEvents: React.ComponentClass<Partial<DeprecatedFrameWithEventsProps>>;

/** @public */
export declare type DeprecatedFrameWithEventsProps = DeprecatedCoreFrameProps & WithEventsProperties;

/**
 * The Stack component takes the same props as the {@link Frame} component as well as a few
 * additional interface defined below.
 * @public
 */
declare interface DeprecatedStackProperties extends StackSpecificProps, DeprecatedFrameProperties, LayerProps {
}

declare interface DeprecatedTransformProperties {
    z: Animatable<number> | number;
    rotation: Animatable<number> | number;
    rotationX: Animatable<number> | number;
    rotationY: Animatable<number> | number;
    rotationZ: Animatable<number> | number;
    scale: Animatable<number> | number;
    scaleX: Animatable<number> | number;
    scaleY: Animatable<number> | number;
    scaleZ: Animatable<number> | number;
    skew: Animatable<number> | number;
    skewX: Animatable<number> | number;
    skewY: Animatable<number> | number;
    originX: Animatable<number> | number;
    originY: Animatable<number> | number;
    originZ: Animatable<number> | number;
}

declare type DeprecatedVisualProperties = Partial<BackgroundProperties & RadiusProperties & FilterProperties & BackgroundFilterProperties & BlendingProperties & OverflowProperties & BoxShadowProperties & WithOpacity & TextColorProperties>;

/* Excluded from this release type: DesignComponentDefinition */

/* Excluded from this release type: Device */

/* Excluded from this release type: DeviceDescriptor */

/* Excluded from this release type: DeviceHand */

/* Excluded from this release type: DeviceHands */

/* Excluded from this release type: DeviceProperties */

/* Excluded from this release type: DeviceRegistry */

/* Excluded from this release type: DeviceRenderer */

/* Excluded from this release type: DeviceRendererMode */

/* Excluded from this release type: DeviceRendererProperties */

/* Excluded from this release type: DevicesData */

/* Excluded from this release type: DeviceSkin */

/* Excluded from this release type: DeviceSkins */

declare type DragEventHandler<Draggable> = (event: FramerEvent, draggable: Draggable) => void;

declare interface DragEvents<Draggable> {
    onMove: (point: Point, draggable: Draggable) => void;
    /**
     * @beta
     */
    onDragDirectionLockStart: (axis: Axis, draggable: Draggable) => void;
    onDragAnimationStart: (animation: {
        x: AnimationInterface;
        y: AnimationInterface;
    }, draggable: Draggable) => void;
    onDragAnimationEnd: (animation: {
        x: AnimationInterface;
        y: AnimationInterface;
    }, draggable: Draggable) => void;
    onDragSessionStart: DragEventHandler<Draggable>;
    onDragSessionMove: DragEventHandler<Draggable>;
    onDragSessionEnd: DragEventHandler<Draggable>;
    onDragStart: DragEventHandler<Draggable>;
    onDragWillMove: DragEventHandler<Draggable>;
    onDragDidMove: DragEventHandler<Draggable>;
    onDragEnd: DragEventHandler<Draggable>;
}

/** @public */
export declare const Draggable: React.ComponentClass<Partial<DeprecatedFrameWithEventsProps> & Partial<DraggableProps<typeof DeprecatedFrameWithEvents>>>;

declare interface DraggableProps<Draggable> extends DraggableSpecificProps<Draggable> {
    enabled: boolean;
}

declare interface DraggableSpecificProps<Draggable> extends Partial<DragEvents<Draggable>> {
    momentum: boolean;
    momentumOptions: {
        friction: number;
        tolerance: number;
    };
    momentumVelocityMultiplier: number;
    speedX: number;
    speedY: number;
    bounce: boolean;
    bounceOptions: {
        friction: number;
        tension: number;
        tolerance: number;
    };
    directionLock: boolean;
    directionLockThreshold: {
        x: number;
        y: number;
    };
    overdrag: boolean;
    overdragScale: number;
    pixelAlign: boolean;
    velocityTimeout: number;
    velocityScale: number;
    horizontal: boolean;
    vertical: boolean;
    constraints: Partial<Rect>;
    mouseWheel: boolean;
}

/* Excluded from this release type: DriverClass */

declare type EaseOptions = Omit<BezierOptions, "curve">;

/** @public */
export declare interface EnumControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.Enum;
    defaultValue?: string;
    options: string[];
    optionTitles?: string[] | ((props: P | null) => string[]);
}

/* Excluded from this release type: ErrorDefinition */

declare type EventDispatcher = (type: string, event: FramerEvent, target: EventTarget) => void;

declare class EventEmitter<EventName> {
    private _emitter;
    eventNames(): string[];
    eventListeners(): {
        [index: string]: ListenerFn[];
    };
    on(eventName: EventName, fn: Function): void;
    off(eventName: EventName, fn: Function): void;
    once(eventName: EventName, fn: Function): void;
    unique(eventName: EventName, fn: Function): void;
    addEventListener(eventName: EventName, fn: Function, once: boolean, unique: boolean, context: Object): void;
    removeEventListeners(eventName?: EventName, fn?: Function): void;
    removeAllEventListeners(): void;
    countEventListeners(eventName?: EventName, handler?: Function): number;
    emit(eventName: EventName, ...args: any[]): void;
}

declare type EventHandler = (event: FramerEvent) => void;

/**
 * @remarks This feature is still in beta
 * @public
 */
export declare interface EventHandlerControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.EventHandler;
}

/* Excluded from this release type: ExternalDeviceHand */

/* Excluded from this release type: ExternalDeviceSkin */

/**
 * @beta
 */
export declare interface FadeTransitionOptions extends NavigationTransitionAnimation {
}

/** @public */
export declare interface FileControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.File;
    allowedFileTypes: string[];
}

declare interface FillProperties {
    fill: Animatable<Background> | Background | null;
}

declare interface FilterNumberProperties {
    brightness: number;
    contrast: number;
    grayscale: number;
    hueRotate: number;
    invert: number;
    saturate: number;
    sepia: number;
    blur: number;
}

declare interface FilterProperties extends FilterNumberProperties {
    dropShadows: Shadow[];
}

/**
 * @public
 */
declare type FinishFunction = (transaction: TransactionId) => void;

declare type FlatControlDescription<P = any> = Omit_2<NumberControlDescription<P>, "hidden"> | Omit_2<EnumControlDescription<P>, "hidden"> | Omit_2<BooleanControlDescription<P>, "hidden"> | Omit_2<StringControlDescription<P>, "hidden"> | Omit_2<ColorControlDescription<P>, "hidden"> | Omit_2<FusedNumberControlDescription<P>, "hidden"> | Omit_2<SegmentedEnumControlDescription<P>, "hidden"> | Omit_2<ImageControlDescription<P>, "hidden"> | Omit_2<FileControlDescription<P>, "hidden"> | Omit_2<ComponentInstanceDescription<P>, "hidden">;

/**
 * @beta
 */
export declare interface FlipTransitionOptions extends NavigationTransitionAnimation, NavigationTransitionAppearsFrom {
}

/** @public */
export declare const Frame: React.ForwardRefExoticComponent<Partial<FrameProps> & React.RefAttributes<HTMLDivElement>>;

/**
 * @internalremarks do no use separately from FrameProps
 * @public
 * */
export declare interface FrameLayoutProperties {
    /**
     * Distance from the top in pixels. Set to `0` by default.
     * @remarks
     * ```jsx
     * <Frame top={100} />
     * ```
     * @public
     */
    top: number | string | MotionValue<number | string>;
    /**
     * Distance from the right in pixels. Set to `0` by default.
     * @remarks
     * ```jsx
     * <Frame right={100} />
     * ```
     * @public
     */
    right: number | string | MotionValue<number | string>;
    /**
     * Distance from the bottom in pixels. Set to `0` by default.
     * @remarks
     * ```jsx
     * <Frame bottom={100} />
     * ```
     * @public
     */
    bottom: number | string | MotionValue<number | string>;
    /**
     * Distance from the left in pixels. Set to `0` by default.
     * @remarks
     * ```jsx
     * <Frame left={100} />
     * ```
     * @public
     */
    left: number | string | MotionValue<number | string>;
    /**
     * Set the CSS `width` property. Set to `200` by default. Accepts all CSS value types (including pixels, percentages, keywords and more).
     * @remarks
     * ```jsx
     * // Pixels
     * <Frame width={100} />
     *
     * // Percentages
     * <Frame width={"100%"} />
     * ```
     * @public
     */
    width: number | string | MotionValue<number | string>;
    /**
     * Set the CSS `height` property. Set to `200` by default. Accepts all CSS value types (including pixels, percentages, keywords and more).
     * @remarks
     * ```jsx
     * // Pixels
     * <Frame height={100} />
     *
     * // Percentages
     * <Frame height={"100%"} />
     *
     * ```
     * @public
     */
    height: number | string | MotionValue<number | string>;
    /**
     * Set the CSS `position` property. Set to `"absolute"` by default.
     * @remarks
     * ```jsx
     * <Frame position={"relative"} />
     * ```
     * @public
     */
    position: React.CSSProperties["position"];
    /**
     * Shortcut for centering Frames.
     * @remarks
     * ```jsx
     * // Center
     * <Frame center />
     *
     * // Center horizontally
     * <Frame center="x" />
     *
     * // Center vertically
     * <Frame center="y" />
     * ```
     * @public
     */
    center: boolean | "x" | "y";
    /**
     * Shortcut for setting the width and height simultaneously.
     * @remarks
     * ```jsx
     * <Frame size={100} />
     * ```
     * @public
     */
    size: number | string;
}

/** @public */
export declare interface FrameProps extends BackgroundProperties, VisualProperties, Omit<MotionDivProps, "color">, CSSTransformProperties, LayerProps, FrameLayoutProperties, ConstraintConfiguration, BaseFrameProps {
}

/**
 * The animation object returned by the {@link (animate:function)} functions
 * @remarks
 * Can be used to control a animation or wait for it to finish. You never create a FramerAnimation yourself, but store the return type from the animate function.
 * ```jsx
 * const animation = animate.ease(value, 100)
 * await animation.finished()
 * const animation = animate.spring(value, 200)
 * animation.cancel()
 * ```
 * @privateRemarks
 * This could be called just Animation, but it's type would clash with
 * javascript's native Animation: https://developer.mozilla.org/en-US/docs/Web/API/Animation
 * So if you forget the import, you would get weird errors.
 *
 * Also, this class follows the native Animation as much as possible.
 * @public
 * @deprecated Use the {@link useAnimation} hook instead
 */
export declare class FramerAnimation<Value, AnimatorOptions> {
    /* Excluded from this release type: driver */
    /* Excluded from this release type: __constructor */
    /* Excluded from this release type: driverCallbackHandler */
    /* Excluded from this release type: playStateSource */
    /* Excluded from this release type: playStateValue */
    /* Excluded from this release type: playState */
    /* Excluded from this release type: onfinish */
    /* Excluded from this release type: oncancel */
    /* Excluded from this release type: readyPromise */
    /* Excluded from this release type: readyResolve */
    /* Excluded from this release type: resetReadyPromise */
    /**
     * Wait for the animation to be ready to play.
     * @remarks
     * ```jsx
     * const animation = animate.ease(value, 100)
     * animation.ready().then(() => {
     *    // Animation is ready
     * })

     * // async/await syntax
     * const animation = animate.ease(value, 100)
     * await animation.ready()
     * // Animation is ready
     * ```
     * @returns Promise that is resolved when the animation is ready to play
     * @public
     */
    readonly ready: Promise<void>;
    /* Excluded from this release type: finishedPromise */
    /* Excluded from this release type: finishedResolve */
    /* Excluded from this release type: finishedReject */
    /* Excluded from this release type: resetFinishedPromise */
    /**
     * Wait for the animation to be finished.
     * @remarks
     * ```jsx
     * // async/await syntax
     * const animation = animate.ease(value, 100)
     * await animation.finished()
     * // Animation is finished
     *
     *
     * const animation = animate.ease(value, 100)
     * animation.ready().then(() => {
     *    // Animation is finished
     * })
     * ```
     * @returns Promise that is resolved when the animation is ready to play
     * @public
     */
    readonly finished: Promise<void>;
    /* Excluded from this release type: play */
    /**
     * Cancels the animation if it is still running.
     * @remarks
     * ```jsx
     * const animation = animate.ease(value, 100, {duration: 3})
     * setTimeout(() => animation.cancel(), 500)
     * ```
     * @public
     */
    cancel(): void;
    /* Excluded from this release type: finish */
    /* Excluded from this release type: isFinished */
}

declare type FramerAnimationState = "idle" | "running" | "finished";

/* Excluded from this release type: FramerAppleIMac */

/* Excluded from this release type: FramerAppleIPadAir */

/* Excluded from this release type: FramerAppleIPadMini */

/* Excluded from this release type: FramerAppleIPadPro */

/* Excluded from this release type: FramerAppleIPhone8 */

/* Excluded from this release type: FramerAppleIPhone8Plus */

/* Excluded from this release type: FramerAppleIPhoneSE */

/* Excluded from this release type: FramerAppleIPhoneX */

/* Excluded from this release type: FramerAppleIPhoneXR */

/* Excluded from this release type: FramerAppleIPhoneXS */

/* Excluded from this release type: FramerAppleIPhoneXSMax */

/* Excluded from this release type: FramerAppleMacBook */

/* Excluded from this release type: FramerAppleMacBookAir */

/* Excluded from this release type: FramerAppleMacBookPro */

/* Excluded from this release type: FramerAppleThunderboltDisplay */

/* Excluded from this release type: FramerAppleWatch38 */

/* Excluded from this release type: FramerAppleWatch42 */

/* Excluded from this release type: FramerDellXPS */

/**
 * @public
 */
export declare class FramerEvent {
    /* Excluded from this release type: originalEvent */
    /* Excluded from this release type: session */
    /* Excluded from this release type: time */
    /* Excluded from this release type: loopTime */
    /* Excluded from this release type: point */
    /* Excluded from this release type: devicePoint */
    /* Excluded from this release type: target */
    /* Excluded from this release type: delta */
    /* Excluded from this release type: __constructor */
    private static eventLikeFromOriginalEvent;
    /* Excluded from this release type: velocity */
    /* Excluded from this release type: offset */
    /* Excluded from this release type: isLeftMouseClick */
}

/* Excluded from this release type: FramerEventListener */

/* Excluded from this release type: FramerEventSession */

/* Excluded from this release type: FramerGoogleNexus4 */

/* Excluded from this release type: FramerGoogleNexus5X */

/* Excluded from this release type: FramerGoogleNexus6 */

/* Excluded from this release type: FramerGoogleNexusTablet */

/* Excluded from this release type: FramerGooglePixel2 */

/* Excluded from this release type: FramerGooglePixel2XL */

/* Excluded from this release type: FramerGooglePixel3 */

/* Excluded from this release type: FramerGooglePixel3XL */

/* Excluded from this release type: FramerHTCOneA9 */

/* Excluded from this release type: FramerMicrosoftLumia950 */

/* Excluded from this release type: FramerMicrosoftSurfaceBook */

/* Excluded from this release type: FramerMicrosoftSurfacePro3 */

/* Excluded from this release type: FramerMicrosoftSurfacePro4 */

/* Excluded from this release type: FramerSamsungGalaxyS8 */

/* Excluded from this release type: FramerSamsungGalaxyS9 */

/* Excluded from this release type: FramerSamsungNote5 */

/* Excluded from this release type: FramerSonySmartWatch */

/* Excluded from this release type: FramerSonyW850C */

/* Excluded from this release type: FramerStoreArtwork */

/* Excluded from this release type: FramerStoreIcon */

/** @public */
export declare interface FusedNumberControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.FusedNumber;
    defaultValue?: number;
    toggleKey: keyof P;
    toggleTitles: [string, string];
    valueKeys: [keyof P, keyof P, keyof P, keyof P];
    valueLabels: [string, string, string, string];
    min?: number;
}

/* Excluded from this release type: GestureHandler */

/**
 * Retrieve the title and controls of an action
 * @param action - a reference to an {@link Action}
 * @returns an object containing the title and controls, or undefined
 * @beta
 */
export declare function getActionControls(action: Action): ActionInfo | undefined;

/* Excluded from this release type: getConfigFromPreviewURL */

/* Excluded from this release type: getConfigFromVekterURL */

/* Excluded from this release type: getPropertyControls */

/**
 * @public
 */
declare type Gradient = LinearGradient | RadialGradient;

/**
 * @public
 */
declare interface GradientColorStop {
    value: string;
    position: number;
}

/** @public */
declare interface IdentityProps {
    id?: string;
}

/** @public */
export declare interface ImageControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.Image;
}

declare type ImageFit = "fill" | "fit" | "stretch";

declare type IncomingColor = ColorRGB | ColorHSL | ColorRGBA | ColorHSLA | string;

/**
 * @public
 */
declare interface Interpolation<Value = any> {
    /**
     * @beta
     */
    interpolate(from: Value, to: Value): Interpolator<Value>;
    /**
     * difference(from, to) calculates a measure of difference between two values,
     * such that for every value of from, to and x holds:
     * interpolator = interpolate(from, to)
     * total = difference(from, to)
     * interpolator( difference(from, x) / total ) === x
     * @beta
     */
    difference(from: Value, to: Value): number;
}

/**
 * @public
 */
declare namespace Interpolation {
    /**
     * @param from -
     * @param to -
     * @beta
     */
    function handleUndefined<Value>(from: Value, to: Value): [Value, Value];
}

declare interface InterpolationOptions {
    colorModel: ColorMixModelType;
}

/**
 * @beta
 */
declare type Interpolator<Value> = (progress: number) => Value;

/* Excluded from this release type: isAction */

/* Excluded from this release type: isOverride */

/* Excluded from this release type: isReactDefinition */

/* Excluded from this release type: JSONArray */

/* Excluded from this release type: JSONData */

/* Excluded from this release type: JSONObject */

/**
 * @public
 */
declare class Layer<P extends Partial<LayerProps>, S> extends React.Component<P, S> {
    static readonly defaultProps: LayerProps;
    static applyWillChange<P extends WillChangeTransformProp>(layer: {
        props: P;
    }, style: MotionStyle): void;
    /* Excluded from this release type: shouldComponentUpdate */
    props: Readonly<P> & Readonly<{
        children?: ReactNode;
    }>;
    private previousZoom;
    /* Excluded from this release type: componentDidUpdate */
}

/** @public */
declare interface LayerProps extends IdentityProps, WillChangeTransformProp {
    children?: ReactNode;
    key?: React.Key;
    /* Excluded from this release type: _forwardedOverrides */
}

declare interface LayoutProperties extends PositionProperties, SizeProperties {
}

/**
 * @public
 */
declare type LinearGradient = LinearGradientBase & (SimpleGradient | MultiStopGradient);

/**
 * @public
 */
declare namespace LinearGradient {
    /**
     * @param value -
     */
    function isLinearGradient(value: any): value is LinearGradient;
    /* Excluded from this release type: hash */
    /* Excluded from this release type: toCSS */
}

/**
 * @public
 */
declare interface LinearGradientBase {
    alpha: number;
    angle: number;
}

/* Excluded from this release type: LineCap */

/* Excluded from this release type: LineJoin */

/* Excluded from this release type: loadJSON */

/**
 * @public
 */
declare class Loop extends EventEmitter<LoopEventNames> {
    private _started;
    private _frame;
    private _frameTasks;
    /* Excluded from this release type: addFrameTask */
    private _processFrameTasks;
    /* Excluded from this release type: TimeStep */
    /* Excluded from this release type: __constructor */
    /* Excluded from this release type: start */
    /* Excluded from this release type: stop */
    /* Excluded from this release type: frame */
    /* Excluded from this release type: time */
    /* Excluded from this release type: tick */
}

declare type LoopEventNames = "render" | "update" | "finish";

/* Excluded from this release type: MainLoop */

declare type Mixer = (from: string | Color, toColor: Color, options?: ColorMixOptions) => (p: number) => string;

declare type MixerStateful = (toColor: Color, options?: ColorMixOptions) => (p: number) => string;

/**
 * @beta
 */
export declare interface ModalTransitionOptions extends NavigationTransitionAnimation, NavigationTransitionBackdropColor {
}

declare type MotionDivProps = HTMLMotionProps<"div">;

/**
 * @public
 */
declare interface MultiStopGradient {
    stops: GradientColorStop[];
}

/* Excluded from this release type: NavigateTo */

/* Excluded from this release type: Navigation */

/**
 * Provides {@link NavigationInterface} that can be used to start transitions in Framer X.
 * @beta
 */
export declare const NavigationConsumer: React.ExoticComponent<React.ConsumerProps<NavigationInterface>>;

/**
 * The navigator allows control over the built-in navigation component in Framer X.
 * @beta
 */
export declare interface NavigationInterface {
    /**
     * Go back to the previous screen. If a stack of overlays is presented, all overlays are dismissed.
     * @beta
     * */
    goBack: () => void;
    /**
     * Show new screen instantly.
     * @param component - The incoming component
     * @beta
     */
    instant: (component: React.ReactNode) => void;
    /**
     * Fade in new screen.
     * @param component - The incoming component
     * @param options - {@link FadeTransitionOptions}
     * @beta
     */
    fade: (component: React.ReactNode, options?: FadeTransitionOptions) => void;
    /**
     * Push new screen. Defaults from right to left, the direction can be changed using the {@link NavigationTransitionOptions}.
     * @param component - The incoming component
     * @param options - {@link PushTransitionOptions}
     * @beta
     */
    push: (component: React.ReactNode, options?: PushTransitionOptions) => void;
    /**
     * Present modal overlay in the center.
     * @param component - The incoming component
     * @param options - {@link ModalTransitionOptions}
     * @beta
     */
    modal: (component: React.ReactNode, options?: ModalTransitionOptions) => void;
    /**
     * Present overlay from one of four edges. The direction can be changed using the {@link NavigationTransitionOptions}.
     * @param component - The incoming component
     * @param options - {@link OverlayTransitionOptions}
     * @beta
     */
    overlay: (component: React.ReactNode, options?: OverlayTransitionOptions) => void;
    /**
     * Flip incoming and outgoing screen in 3D. The flip direction can be changed using the {@link NavigationTransitionOptions}.
     * @param component - The incoming component
     * @param options - {@link FlipTransitionOptions}
     * @beta
     */
    flip: (component: React.ReactNode, options?: FlipTransitionOptions) => void;
    /**
     * Present a screen using a custom {@link NavigationTransition}.
     * @param component - The incoming component
     * @param transition - {@link NavigationTransition}
     * @beta
     */
    customTransition: (component: React.ReactNode, transition: NavigationTransition) => void;
}

/* Excluded from this release type: NavigationLink */

/* Excluded from this release type: NavigationProps */

declare interface NavigationState {
    current: number;
    previous: number;
    currentOverlay: number;
    previousOverlay: number;
}

/* Excluded from this release type: NavigationTarget */

/**
 * Can be used to define a custom navigation transition.
 * @beta
 */
export declare interface NavigationTransition extends NavigationTransitionAnimation, NavigationTransitionBackdropColor {
    /**
     * Defines the begin state of the incoming screen wrapper.
     */
    enter?: Partial<FrameProps>;
    /**
     * Defines the end state of the outgoing screen wrapper.
     */
    exit?: Partial<FrameProps>;
    /**
     * Defines the position and size of the incoming screen wrapper. Defaults to top, right, bottom, and left of 0.
     */
    position?: NavigationTransitionPosition;
    /**
     * Defines whether the incoming screen should render over the current context, like an overlay or modal. Defaults to false.
     */
    overCurrentContext?: boolean;
    /**
     * Defines whether a tap in the background should dismiss the screen presented over the current context. Defaults to true.
     */
    goBackOnTapOutside?: boolean;
    /**
     * Defines whether the backface of the incoming and outgoing screens should be visible, necessary for certain 3D transitions. Defaults to true.
     */
    backfaceVisible?: boolean;
}

/**
 * @beta
 */
export declare interface NavigationTransitionAnimation {
    /**
     * The animation defaults.
     */
    animation?: Transition;
}

/**
 * @beta
 */
export declare interface NavigationTransitionAppearsFrom {
    /**
     * Defines which side the target will appear from.
     * @remarks
     *
     * - `"left"`
     * - `"right"`
     * - `"top"`
     * - `"bottom"`
     */
    appearsFrom?: NavigationTransitionSide;
}

/**
 * @beta
 */
export declare interface NavigationTransitionBackdropColor {
    /**
     * Defines the backdrop color when the incoming screen is rendered over the current context. Defaults to the iOS dim color.
     */
    backdropColor?: string;
}

/* Excluded from this release type: NavigationTransitionDirection */

/**
 * @beta
 */
export declare type NavigationTransitionPosition = Partial<Pick<FrameLayoutProperties, "top" | "right" | "bottom" | "left" | "center">>;

/**
 * @beta
 */
export declare type NavigationTransitionSide = "left" | "right" | "top" | "bottom";

/* Excluded from this release type: NavigationTransitionType */

declare interface NewConstraintProperties extends Partial<LayoutProperties>, ConstraintConfiguration {
}

/** @public */
export declare interface NumberControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.Number;
    defaultValue?: number;
    max?: number;
    min?: number;
    unit?: string;
    step?: number;
    displayStepper?: boolean;
}

/* Excluded from this release type: ObservableObject */

/**
 * @public
 */
declare type Observer<Value> = {
    update: UpdateFunction<Value>;
    finish: FinishFunction;
} | UpdateFunction<Value>;

declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

declare type Omit_2<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

declare type Overflow = "visible" | "hidden" | "scroll" | "auto";

declare interface OverflowProperties {
    overflow: Overflow;
}

/**
 * @beta
 */
export declare interface OverlayTransitionOptions extends NavigationTransitionAnimation, NavigationTransitionAppearsFrom, NavigationTransitionBackdropColor {
}

/** @public */
export declare type Override<T extends object = FrameProps & {
    [key: string]: any;
}> = OverrideObject<T> | OverrideFunction<T>;

/** @public */
export declare type OverrideFunction<P extends object = any> = (props: P) => Partial<P>;

/** @public */
export declare type OverrideObject<T extends object = any> = Partial<T>;

/* Excluded from this release type: PackageIdentifier */

/**
 * The Page component allows you to create horizontally or vertically swipeable areas. It can be
 * imported from the Framer Library and used in code components. Add children to create pages to
 * swipe between. These children will be stretched to the size of the page component by default,
 * but can also be set to auto to maintain their original size.
 *
 * @remarks
 * ```jsx
 * import * as React from "react"
 * import { Frame, Page } from "framer"
 * export class Page extends React.Component {
 *   render() {
 *     return (
 *       <Page>
 *         <Frame />
 *       </Page>
 *     )
 *   }
 * }
 * ```
 * @public
 */
export declare class Page extends React.Component<Partial<PageProps>, PageState> {
    /* Excluded from this release type: _isStylable */
    static supportsConstraints: boolean;
    /* Excluded from this release type: contextType */
    /* Excluded from this release type: context */
    private pages;
    private propsBoundedCurrentPage;
    private shouldReflectPropsBoundedCurrentPage;
    private contentOffset;
    private currentContentPage;
    private isScrolling;
    private scrollControls;
    private containerRef;
    state: PageState;
    private static pageProps;
    /* Excluded from this release type: defaultProps */
    /* Excluded from this release type: propertyControls */
    private readonly isHorizontalDirection;
    private readonly currentContentOffset;
    private boundedCurrentPage;
    /* Excluded from this release type: componentDidMount */
    /* Excluded from this release type: componentWillUnmount */
    /* Excluded from this release type: componentWillUpdate */
    private setContainerSize;
    /* Excluded from this release type: componentDidUpdate */
    private nearestPageIndex;
    private onDragEnd;
    private applyEffects;
    private contentOffsetUpdated;
    private effectValues;
    private wrapHandler;
    private offsetForPage;
    private updateOffsetForPage;
    private onDragStart;
    private onDirectionLock;
    /* Excluded from this release type: render */
}

/**
 * @public
 */
export declare type PageAlignment = "start" | "center" | "end";

declare type PageContentDimension = "auto" | "stretch";

declare type PageDirection = "horizontal" | "vertical";

/**
 * Page effects change the behavior of the transition when swiping between pages.
 * By default there is no page effect applied.
 * @remarks
 * ```jsx
 * import * as React from "react"
 * import { Page, PageEffect } from "framer"
 *
 * export function MyComponent() {
 *  return <Page defaultEffect={"cube"} />
 * }
 * ```
 *
 * `"none"` - No custom effect is applied. This is the default.
 * `"cube"` - Each page is positioned as a 3D cube, connected to the current page.
 * `"coverflow"` - Each page is positioned in 3D, behind the current page.
 * `"wheel"` - Each page is gently titled in 3D, like a wheel.
 * `"pile"` - Each page is stacked behind the current page.
 * @public
 */
export declare type PageEffect = "none" | "cube" | "coverflow" | "wheel" | "pile";

/**
 * Information about the current effect.
 * @public
 */
export declare interface PageEffectInfo {
    /**
     * The offset of this page, in pixels, measured from the left-most part of the container.
     * @public
     */
    offset: number;
    /**
     * The offset of this page, normalised to the page size.
     *
     * For instance, if each page is `200` pixels wide, and we're on page index `1`, the `normalizedOffset` of page index `0` will be `-1`.
     * @public
     */
    normalizedOffset: number;
    /**
     * The `width` and `height` of the page.
     * @public
     */
    size: Size;
    /**
     * The index of the current page. The first page is `0`, the second is `1` and so on.
     * @public
     */
    index: number;
    /**
     * The direction of page scrolling, `"horizontal"` or `"vertical"`
     * @public
     */
    direction: PageDirection;
    /**
     * The gap between each page, in pixels.
     * @public
     */
    gap: number;
    /**
     * The total number of pages.
     *
     * @public
     */
    pageCount: number;
}

declare type PageEffectValues = {
    [key: string]: string | number | boolean;
};

/**
 * Event callbacks for the Page component, can be used to react to and co-ordinate
 * with other components.
 *
 * @public
 */
export declare interface PageEvents {
    /**
     * A callback that will be invoked when changing the page.
     * @remarks
     * This will be invoked when the drag animation begins or when the page changes
     * programatically. It can be used to co-ordinate with other behaviors.
     *
     * @param currentIndex - The current page number
     * @param previousIndex - The index of the previous page
     * @param pageComponent - The Page component for the current page.
     * @public
     * @remarks
     * ```jsx
     * <Page
     *     onChangePage={(current, previous, page) => {
     *         console.log(current, previous, page)
     *     }}
     * />
     * ```
     */
    onChangePage(currentIndex: number, previousIndex: number, pageComponent: Page): void;
}

/**
 * All properties that can be used with the {@link Page} component it also extends all {@link ScrollProps} properties.
 * ```jsx
 * <Page
 *   direction={"horizontal"}
 *   contentWidth={"stretch"}
 *   contentHeight={"stretch"}
 *   alignment={"center"}
 *   currentPage={0}
 *   animateCurrentPageUpdate={true}
 *   gap={10}
 *   padding={0}
 *   paddingPerSide={true}
 *   paddingTop={0}
 *   paddingRight={0}
 *   paddingBottom={0}
 *   paddingLeft={0}
 *   momentum={false}
 *   dragEnabled={false}
 *   defaultEffect={PageEffect.Cube}>
 *   <Frame background="#19E" />
 *   <Frame background="#5CF" />
 *   <Frame background="#2CD" />
 * </Page>
 * ```
 * @public
 */
export declare interface PageProperties {
    /**
     * Current swipe direction. Either "horizontal" or "vertical". Set to `"horizontal"` by
     * default.
     *
     * @remarks
     * ```jsx
     * <Page direction="horizontal" />
     * ```
     */
    direction: PageDirection;
    /**
     * Width of the pages within the component. Either "auto" or "stretch" or a numeric value. Set
     * to `"stretch"` by default.
     *
     * @remarks
     * ```jsx
     * <Page contentWidth="auto" />
     * ```
     */
    contentWidth: PageContentDimension | number;
    /**
     * Height of the pages within the component. Either "auto" or "stretch" or a numeric value. Set
     * to `"stretch"` by default.
     *
     * @remarks
     * ```jsx
     * <Page contentHeight="auto" />
     * ```
     */
    contentHeight: PageContentDimension | number;
    /**
     * Alignment of the pages within the component. Either "start", "center", or "end". Set to
     * `"start"` by default.
     *
     * @remarks
     * ```jsx
     * <Page alignment="center" />
     * ```
     */
    alignment: PageAlignment;
    /**
     * Index of the current page. Set to `0` by default.
     *
     * @remarks
     * ```jsx
     * <Page currentPage={5} />
     * ```
     */
    currentPage: number;
    /**
     * Determines whether the component should animate page changes. Set to `true` by default.
     *
     * @remarks
     * ```jsx
     * <Page animateCurrentPageUpdate={false} />
     * ```
     * @beta
     */
    animateCurrentPageUpdate: boolean;
    /**
     * A number describing the gap between the page elements. Set to `10` by default.
     *
     * @remarks
     * ```jsx
     * <Page gap={0} />
     * ```
     * */
    gap: number;
    /**
     * Padding to be applied to all sides. Set to `0` by default.
     * To specify different padding for each side, provide
     * individual `paddingTop`, `paddingLeft`, `paddingRight` and `paddingBottom` values.
     *
     * ```jsx
     * <Page padding={20} />
     * ```
     */
    padding: number;
    /**
     * Flag to tell the Page to ignore the `padding` prop and apply values per-side.
     *
     * @remarks
     *
     * ```jsx
     * <Page paddingLeft={20}  />
     * ```
     */
    paddingPerSide?: boolean;
    /**
     * Value for the top padding of the container. Set to `0` by default.
     * ```jsx
     * <Page paddingTop={20}  />
     * ```
     */
    paddingTop?: number;
    /**
     * ```jsx
     * <Page paddingRight={20}  />
     * ```
     * Value for the right padding of the container. Set to `0` by default.
     */
    paddingRight?: number;
    /**
     * ```jsx
     * <Page paddingBottom={20}  />
     * ```
     * Value for the bottom padding of the container. Set to `0` by default.
     */
    paddingBottom?: number;
    /**
     * ```jsx
     * <Page paddingLeft={20}  />
     * ```
     * Value for the left padding of the container. Set to `0` by default.
     */
    paddingLeft?: number;
    /**
     * When enabled you can flick through multiple pages at once.
     * @remarks
     *
     * ```jsx
     * <Page momentum />
     * ```
     */
    momentum: boolean;
    /**
     * Pick one of the predefined effects. Either "none", "cube", "coverflow", "wheel" or "pile". Set to `"none"` by default.
     * @remarks
     *
     * ```jsx
     * <Page defaultEffect={"coverflow"} />
     * ```
     */
    defaultEffect: PageEffect;
    /**
     * Allows you to provide a custom transition effect for individual pages.
     *
     * This function is called once for every page, every time the scroll offset changes. It returns a new set of styles for this page.
     *
     * @param info - A {@link PageEffectInfo} object with information about the current effect.
     * @returns should return a new set of Frame properties.
     *
     * ```jsx
     * function scaleEffect() {
     *     const { normalizedOffset } = info
     *     return {
     *         scale: Math.max(0, 1 + Math.min(0, normalizedOffset * -1))
     *     }
     * }
     *
     * return <Page effect={scaleEffect} />
     * ```
     *
     * @public
     */
    effect?: (info: PageEffectInfo) => PageEffectValues;
}

/**
 * The following are the props accepted by the Page component, these are all in
 * addition to the standard props accepted by all Frame components.
 * @public
 */
export declare interface PageProps extends PageProperties, Partial<Omit<FrameProps, "size" | "onScroll">>, LayerProps, Partial<PageEvents>, Partial<Omit<ScrollProps, "direction" | "contentWidth" | "contentHeight">> {
}

declare interface PageState {
    containerSize: Size | null;
}

declare type ParentSize = Size | ParentSizeState;

declare enum ParentSizeState {
    Unknown = 0,
    Disabled = 1
}

/* Excluded from this release type: PathSegment */

/* Excluded from this release type: PathSegmentRecord */

/**
 * @public
 */
export declare function Point(x: number, y: number): Point;

/**
 * @public
 */
export declare interface Point {
    x: number;
    y: number;
}

/**
 * @public
 */
export declare namespace Point {
    /* Excluded from this release type: add */
    /* Excluded from this release type: subtract */
    /* Excluded from this release type: multiply */
    /* Excluded from this release type: divide */
    /* Excluded from this release type: absolute */
    /* Excluded from this release type: reverse */
    /* Excluded from this release type: pixelAligned */
    /* Excluded from this release type: distance */
    /* Excluded from this release type: angle */
    /** @public */
    const isEqual: (a: Point, b: Point) => boolean;
    /* Excluded from this release type: rotationNormalizer */
    /* Excluded from this release type: center */
}

declare interface PositionProperties {
    top: number | string;
    right: number | string;
    bottom: number | string;
    left: number | string;
    center: "x" | "y" | boolean;
}

/**
 * Prints to the console.
 *
 * @param args - Arguments to print
 * @public
 */
export declare function print(...args: any[]): void;

/** @public */
export declare type PropertyControls<ComponentProps = any, ArrayTypes = any> = {
    [K in keyof ComponentProps]?: ControlDescription<Partial<ComponentProps>>;
};

/* Excluded from this release type: PropertyStore */

/* Excluded from this release type: PropertyTree */

/* Excluded from this release type: Props */

/**
 * @beta
 */
export declare interface PushTransitionOptions extends NavigationTransitionAnimation, NavigationTransitionAppearsFrom {
}

/* Excluded from this release type: QualityOptions */

/**
 * @public
 */
declare type RadialGradient = RadialGradientBase & (SimpleGradient | MultiStopGradient);

/**
 * @public
 */
declare namespace RadialGradient {
    /**
     * @param value -
     * @public
     */
    function isRadialGradient(value: any): value is RadialGradient;
    /* Excluded from this release type: hash */
    /* Excluded from this release type: toCSS */
}

/**
 * @public
 */
declare interface RadialGradientBase {
    alpha: number;
    widthFactor: number;
    heightFactor: number;
    centerAnchorX: number;
    centerAnchorY: number;
}

declare interface RadiusProperties {
    radius: RadiusValue | Partial<{
        topLeft: RadiusValue;
        topRight: RadiusValue;
        bottomLeft: RadiusValue;
        bottomRight: RadiusValue;
    }>;
}

declare type RadiusValue = number | Animatable<number> | string;

/* Excluded from this release type: ReactComponentDefinition */

/**
 * @public
 */
export declare interface Rect extends Point, Size {
}

/**
 * @public
 */
export declare namespace Rect {
    /**
     *
     * @param rect -
     * @param other -
     * @public
     */
    export function equals(rect: Rect | null, other: Rect | null): boolean;
    /* Excluded from this release type: atOrigin */
    /* Excluded from this release type: fromTwoPoints */
    /* Excluded from this release type: fromRect */
    /* Excluded from this release type: multiply */
    /* Excluded from this release type: divide */
    /* Excluded from this release type: offset */
    /* Excluded from this release type: inflate */
    /* Excluded from this release type: pixelAligned */
    /* Excluded from this release type: halfPixelAligned */
    /* Excluded from this release type: round */
    /* Excluded from this release type: roundToOutside */
    /**
     * @param rect -
     * @beta
     */
    const minX: (rect: Rect) => number;
    /**
     * @param rect -
     * @beta
     */
    const maxX: (rect: Rect) => number;
    /**
     * @param rect -
     * @beta
     */
    const minY: (rect: Rect) => number;
    /**
     * @param rect -
     * @beta
     */
    const maxY: (rect: Rect) => number;
    /* Excluded from this release type: positions */
    /**
     *
     * @param rect -
     * @beta
     */
    const center: (rect: Rect) => {
        x: number;
        y: number;
    };
    /* Excluded from this release type: fromPoints */
    /* Excluded from this release type: merge */
    /* Excluded from this release type: intersection */
    /* Excluded from this release type: points */
    /**
     * Checks if a rectangle contains a point
     * @param rect - The rectangle to check
     * @param point - The point to check
     * @returns true if the provided rectangle contains the provided point
     * @beta
     */
    const containsPoint: (rect: Rect, point: Point) => boolean;
    /**
     * Returns wether a rect contains another rect entirely
     * @param rectA -
     * @param rectB -
     * @returns true if rectA contains rectB
     */
    const containsRect: (rectA: Rect, rectB: Rect) => boolean;
    /* Excluded from this release type: toCSS */
    /* Excluded from this release type: inset */
    /* Excluded from this release type: intersects */
    /* Excluded from this release type: overlapHorizontally */
    /* Excluded from this release type: overlapVertically */
    /* Excluded from this release type: doesNotIntersect */
    /**
     *
     * @param rectA -
     * @param rectB -
     * @returns if the input rectangles are equal in size and position
     * @public
     */
    const isEqual: (rectA: Rect | null, rectB: Rect | null) => boolean;
    /* Excluded from this release type: cornerPoints */
    /* Excluded from this release type: midPoints */
    /* Excluded from this release type: pointDistance */
    /* Excluded from this release type: fromAny */
}

/* Excluded from this release type: RenderEnvironment */

/**
 * The `RenderTarget` represents the current environment in which a component
 * is running. This is most commonly either the editor canvas in the Framer X
 * application or in the generated preview window.
 *
 * @remarks
 * Code components can use the `RenderTarget.current()` method to check for
 * the environment within their components and vary rendering accordingly. The
 * most common case would be to improve performance while rendering in the
 * Framer X canvas where components that take too long to render will be
 * replaced with a placeholder. The
 * `RenderTarget.hasRestrictions()` method can be used to check explicitly
 * for this case.
 *
 * @public
 */
export declare enum RenderTarget {
    /**
     * The component is to be rendered for the Framer X canvas.
     *
     * @remarks
     * ```jsx
     * function App() {
     *   if (RenderTarget.current() === RenderTarget.canvas) {
     *     return <CanvasComponent />
     *   }
     *   return <DefaultComponent />
     * }
     * ```
     */
    canvas = "CANVAS",
    /**
     * The component is to be rendered for export.
     *
     * @remarks
     * ```jsx
     * function App() {
     *   if (RenderTarget.current() === RenderTarget.export) {
     *     return <ExportComponent />
     *   }
     *   return <DefaultComponent />
     * }
     * ```
     */
    export = "EXPORT",
    /**
     * The component is to be rendered as a preview thumbnail, for example in the
     * component panel.
     *
     * @remarks
     * ```jsx
     * function App() {
     *   if (RenderTarget.current() === RenderTarget.thumbnail) {
     *     return <Thumbnail />
     *   }
     *   return <DefaultComponent />
     * }
     * ```
     */
    thumbnail = "THUMBNAIL",
    /**
     * The component is being rendered in the preview window.
     *
     * @remarks
     * ```jsx
     * function App() {
     *   React.useEffect(() => {
     *     if (RenderTarget.current() === RenderTarget.preview) {
     *       // Do something in preview.
     *     }
     *   })
     *   return <DefaultComponent />
     * }
     * ```
     */
    preview = "PREVIEW"
}

/**
 * @internalRemarks
 * This is a read-only equivalent of RenderEnvironment.target that is exposed
 * to components for context-dependent rendering
 * @public
 */
export declare namespace RenderTarget {
    /**
     * Returns the current `RenderTarget` allowing components to apply
     * different behaviors depending on the environment.
     *
     * @remarks
     * ```jsx
     * function App() {
     *   if (RenderTarget.current() === RenderTarget.thumbnail) {
     *     return <PreviewIcon />
     *   }
     *   return <Frame>...</Frame>
     * }
     * ```
     */
    export function current(): RenderTarget;
    /**
     * Returns true if the current `RenderTarget` has performance restrictions.
     * Use this to avoid doing heavy work in these contexts because they may
     * bail on the rendering if the component takes too long.
     *
     * @remarks
     * ```jsx
     * function App() {
     *   if (RenderTarget.hasRestrictions()) {
     *     return <SomePlaceholder />
     *   }
     *   return <RichPreviewContent />
     * }
     * ```
     */
    export function hasRestrictions(): boolean;
}

/**
 * @public
 */
export declare function Scroll(props: ScrollProps): JSX.Element;

/**
 * The properties for the {@link Scroll} component, which are also available within other components, like {@link Page}.
 * @public
 */
export declare interface ScrollConfig {
    /**
     * Controls the axis of drag-scrolling.
     * Defaults to `"vertical"` for vertical scrolling.
     *
     * @remarks
     * Set `"horizontal"` or `"vertical"` to only drag in a specific direction.
     * Set `"both"` to drag both directions.
     *
     * ```jsx
     * // Horizontal
     * <Scroll direction="horizontal" />
     *
     * // Vertical
     * <Scroll direction="vertical" />
     *
     * // Locked
     * <Scroll direction="locked" />
     *
     * // Both directions
     * <Scroll direction="both" />
     * ```
     *
     * @public
     */
    direction?: "horizontal" | "vertical" | "both";
    /**
     * If `true`, this will lock dragging to the initial direction.
     *
     * @public
     *
     * ```jsx
     * <Scroll direction="both" directionLock={true} />
     * ```
     */
    directionLock?: boolean;
    /**
     * Enable or disable dragging to scroll. Defaults to `true`.
     *
     * @public
     *
     * ```jsx
     * <Scroll dragEnabled={false} />
     * ```
     */
    dragEnabled?: boolean;
    /**
     * Enable or disable wheel scroll. Defaults to `true`.
     *
     * @public
     *
     * ```jsx
     * <Scroll wheelEnabled={false} />
     * ```
     */
    wheelEnabled?: boolean;
    /**
     * Horizontal offset of the scrollable content. Set to `0` by default
     *
     * @remarks
     * ```jsx
     * <Scroll contentOffsetX={20} />
     * ```
     */
    contentOffsetX?: MotionValue<number> | number;
    /**
     * Vertical offset of the scrollable content. Set to `0` by default.
     *
     * @remarks
     * ```jsx
     * <Scroll contentOffsetY={20} />
     * ```
     */
    contentOffsetY?: MotionValue<number> | number;
    /**
     * Width of the scrollable content.
     *
     * @remarks
     * ```jsx
     * <Scroll contentWidth={500} />
     * ```
     */
    contentWidth?: number;
    /**
     * Height of the scrollable content.
     *
     * @remarks
     * ```jsx
     * <Scroll contentHeight={500} />
     * ```
     */
    contentHeight?: number;
    /**
     * Add a custom control for the scroll animation.
     * @remarks
     * ```jsx
     * const controls = useAnimation()
     * controls.start({ y: -50 })
     * <Scroll scrollAnimate={controls} />
     * ```
     * @public
     * */
    scrollAnimate?: FrameProps["animate"];
    /* Excluded from this release type: __fromCodeComponentNode */
}

/**
 * @public
 */
export declare interface ScrollEvents {
    /**
     * Called when scrolling starts.
     *
     * @remarks
     * ```jsx
     * function onScrollStart(info) {
     *   console.log(info.offset, info.velocity)
     * }
     *
     * <Scroll onScrollStart={onScrollStart} />
     * ```
     * @param info - An {@link PanInfo} object containing `x` and `y` values for:
     *
     *   - `point`: Relative to the device or page.
     *   - `delta`: Distance moved since the last event.
     *   - `offset`: Offset from the original pan event.
     *   - `velocity`: Current velocity of the pointer.
     * @public
     */
    onScrollStart?(info: PanInfo): void;
    /**
     * Called periodically during scrolling.
     *
     * @remarks
     * ```jsx
     * function onScroll(info) {
     *   console.log(info.offset, info.velocity)
     * }
     *
     * <Scroll onScroll={onScroll} />
     * ```
     * @param info - An {@link PanInfo} object containing `x` and `y` values for:
     *
     *   - `point`: Relative to the device or page.
     *   - `delta`: Distance moved since the last event.
     *   - `offset`: Offset from the original pan event.
     *   - `velocity`: Current velocity of the pointer.
     * @public
     */
    onScroll?(info: PanInfo): void;
    /**
     * Called when scrolling ends.
     *
     * @remarks
     * ```jsx
     * function onScrollEnd(info) {
     *   console.log(info.offset, info.velocity)
     * }
     *
     * <Scroll onScrollEnd={onScrollEnd} />
     * ```
     * @param info - An {@link PanInfo} object containing `x` and `y` values for:
     *
     *   - `point`: Relative to the device or page.
     *   - `delta`: Distance moved since the last event.
     *   - `offset`: Offset from the original pan event.
     *   - `velocity`: Current velocity of the pointer.
     * @public
     */
    onScrollEnd?(info: PanInfo): void;
}

/**
 * @public
 */
export declare interface ScrollProps extends Omit<Partial<FrameProps>, "onScroll" | "size">, ScrollEvents, ScrollConfig {
}

/** @public */
export declare interface SegmentedEnumControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.SegmentedEnum;
    defaultValue?: string;
    options: string[];
    optionTitles?: string[] | ((props: P | null) => string[]);
}

/* Excluded from this release type: serverURL */

/* Excluded from this release type: setGlobalRenderEnvironment */

declare type SetState<State> = (latest: State) => void;

declare interface Shadow {
    color: string;
    x: number;
    y: number;
    blur: number;
}

declare namespace Shadow {
    function is(shadow: any): shadow is Shadow;
}

/**
 * @public
 */
declare interface SimpleGradient {
    start: string;
    end: string;
}

/**
 * @public
 */
export declare function Size(width: number, height: number): Size;

/**
 * @public
 */
export declare interface Size {
    width: number;
    height: number;
}

/**
 * @public
 */
export declare namespace Size {
    /* Excluded from this release type: equals */
    /* Excluded from this release type: update */
    /* Excluded from this release type: subtract */
    /**
     * @public
     */
    const zero: Size;
    /**
     * Checks if the size has a zero width and zero height
     * @param size - size to check
     * @public
     */
    const isZero: (size: Size) => boolean;
    /* Excluded from this release type: defaultIfZero */
}

declare interface SizeProperties {
    width: number | string;
    height: number | string;
    size: number | string;
}

/* Excluded from this release type: SpringAnimator */

declare type SpringOptions = TensionFrictionSpringOptions | DampingDurationSpringOptions;

/**
 * The Stack component will automatically distribute its contents based on its
 * properties. See `StackProperties` for details on configuration.
 *
 * @remarks
 * ```jsx
 * function MyComponent() {
 *   return (
 *     <Stack>
 *       <Frame />
 *       <Frame />
 *       <Frame />
 *     </Stack>
 *   )
 * }
 * ```
 * @public
 */
export declare function Stack(props: Partial<StackProperties>): JSX.Element;

export declare namespace Stack {
    var displayName: string;
}

/**
 * @public
 */
declare type StackAlignment = "start" | "center" | "end";

/**
 * @public
 */
declare type StackDirection = "horizontal" | "vertical";

/**
 * @public
 */
declare type StackDistribution = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";

/**
 * @beta
 */
declare interface StackPlaceHolders {
    index: number;
    sizes: Size[];
}

/**
 * The Stack component takes the same props as the {@link Frame} component as well as a few
 * additional interface defined below.
 * @public
 */
export declare interface StackProperties extends StackSpecificProps, FrameProps, WillChangeTransformProp {
    children?: React.ReactNode;
}

/**
 * @public
 */
export declare interface StackSpecificProps {
    /**
     * Defines the flow direction of the stack contents, either `"vertical"` or `"horizontal"`. Set
     * to `"vertical"` by default.
     *
     * @remarks
     * ```jsx
     * // Vertical
     * <Stack direction="vertical" />
     *
     * // Horizontal
     * <Stack direction="horizontal" />
     * ```
     */
    direction: StackDirection;
    /**
     * Defines the distribution of the stack contents. Set to `"space-around"` by default, which makes the contents spread evenly across the container.
     * @remarks
     *
     * - `"start"` — from the leading edge of the container.
     * - `"center"` — centered within the container.
     * - `"end"` — from the trailing edge of the container.
     * - `"space-between"` — spread evenly in the container.
     * - `"space-around"` — spread evenly with excess applied at the start / end.
     * - `"space-evenly"` — spread with equal padding between contents.
     *
     * ```jsx
     * // Default
     * <Stack distribution="space-around" />
     *
     * // Start
     * <Stack distribution="start" />
     *
     * // Center
     * <Stack distribution="center" />
     *
     * // End
     * <Stack distribution="end" />
     *
     * // Space Between
     * <Stack distribution="space-between" />
     *
     * // Space Around
     * <Stack distribution="space-around" />
     *
     * // Space Evenly
     * <Stack distribution="space-evenly" />
     * ```
     */
    distribution: StackDistribution;
    /**
     * Defines the distribution of the stack contents on the alternative axis to the direction. Can
     * be one of `"start"`, `"end",` or `"center"`. Set to `"center"` by default.
     *
     * @remarks
     * ```jsx
     * <Stack alignment="end" />
     * ```
     */
    alignment: StackAlignment;
    /**
     * The gap between items in the stack. Set to `10` by default.
     * @remarks
     * ```jsx
     * <Stack gap={120} />
     * ```
     */
    gap: number;
    /**
     * Padding to be applied to all sides of container. Set to `0` by default.
     * @remarks
     * To specify different padding for each side you can provide
     * individual `paddingTop`, `paddingLeft`, `paddingRight` and `paddingBottom` values.
     *
     * ```jsx
     * <Stack padding={20} />
     * ```
     */
    padding: number;
    /**
     * Flag to tell the Stack to ignore the `padding` prop and apply values per-side.
     *
     * @remarks
     *
     * ```jsx
     * <Stack paddingPerSide paddingLeft={20} paddingBottom={20} />
     * ```
     */
    paddingPerSide: boolean;
    /**
     * Value for the top padding of the container. Set to `0` by default.
     *
     * @remarks
     *
     * ```jsx
     * <Stack paddingTop={20} />
     * ```
     */
    paddingTop: number;
    /**
     * Value for the right padding of the container. Set to `0` by default.
     * @remarks
     *
     * ```jsx
     * <Stack paddingRight={20} />
     * ```
     */
    paddingRight: number;
    /**
     * Value for the left padding of the container. Set to `0` by default.
     *       @remarks
     *
     * ```jsx
     * <Stack paddingLeft={20} />
     * ```
     */
    paddingLeft: number;
    /**
     * Value for the bottom padding of the container. Set to `0` by default.
     * @remarks
     *
     * ```jsx
     * <Stack paddingBottom={20} />
     * ```
     */
    paddingBottom: number;
    /* Excluded from this release type: placeholders */
    /* Excluded from this release type: __fromCodeComponentNode */
}

/* Excluded from this release type: State */

/* Excluded from this release type: State_2 */

/** @public */
export declare interface StringControlDescription<P = any> extends BaseControlDescription<P> {
    type: ControlType.String;
    defaultValue?: string;
    placeholder?: string;
    obscured?: boolean;
}

/* Excluded from this release type: StrokeAlignment */

/* Excluded from this release type: SVG */

/* Excluded from this release type: SVGProperties */

/* Excluded from this release type: SVGProps */

declare interface TensionFrictionSpringOptions {
    tension: number;
    friction: number;
    tolerance: number;
    velocity: number;
}

/* Excluded from this release type: Text */

/* Excluded from this release type: TextAlignment */

declare interface TextColorProperties {
    color: Color | string;
}

/* Excluded from this release type: TextProperties */

/* Excluded from this release type: TextProps */

/* Excluded from this release type: throttle */

declare type ToAnimatableOrValue<PossiblyAnimatable> = PossiblyAnimatable extends Animatable<infer Value> ? Value | Animatable<Value> : PossiblyAnimatable | Animatable<PossiblyAnimatable>;

/* Excluded from this release type: TokenDefinition */

/* Excluded from this release type: TokenIdentifier */

/* Excluded from this release type: TokenMap */

/**
 * @public
 */
declare type TransactionId = number;

/**
 * @public
 */
declare type UpdateFunction<Value> = (change: Change<Value>, transaction?: TransactionId) => void;

/**
 * @public
 */
declare interface UpdateObserver<Value> {
    onUpdate(handler: Observer<Value>): Cancel;
}

/**
 * @returns NavigationInterface {@link NavigationInterface}
 * @beta
 */
export declare function useNavigation(): NavigationInterface;

/* Excluded from this release type: ValueInterpolation */

/* Excluded from this release type: Vector */

/* Excluded from this release type: VectorGroup */

/* Excluded from this release type: VectorGroupProperties */

/* Excluded from this release type: VectorGroupProps */

/* Excluded from this release type: VectorProperties */

/* Excluded from this release type: VectorProps */

/**
 * This version is automatically updated by the Makefile
 * @public
 */
export declare const version = "1.0.18";

/**
 * @internalremarks do no use separately from FrameProps
 * @public
 * */
export declare interface VisualProperties {
    /**
     * Defines whether or not the `Frame` is visible. Unlike `opacity`, this property cannot be animated. Set to `true` by default. Maps to CSS.
     * @remarks
     * ```jsx
     * <Frame visible={false} />
     * ```
     * @public
     */
    visible: boolean;
    /**
     * Set the opacity value, which allows you to make elements semi-transparent or entirely hidden. Useful for show-and-hide animations.
     * Set to `1` by default.
     * @remarks
     * ```jsx
     * <Frame opacity={0.5} />
     * ```
     * @public
     */
    opacity: number | MotionValue<number>;
    /**
     * Set the CSS border property, which accepts width, style and color.
     * Set to `"none"` by default.
     * @remarks
     * ```jsx
     * <Frame border="1px solid #09F" />
     * ```
     * @public
     */
    border: string | MotionValue<string>;
    /**
     * Set the CSS border-radius property, in pixels or percentages.
     * Set to `0` by default.
     * @remarks
     * ```jsx
     * // Radius with pixels
     * <Frame radius={10} />
     *
     * // Radius with percentages
     * <Frame radius="50%" />
     * ```
     * @public
     */
    radius: number | string | MotionValue<number | string>;
    /**
     * Set the CSS border-radius property, in pixels or percentages. Alias for `radius`
     * Set to `0` by default.
     * @remarks
     * ```jsx
     * // Radius with pixels
     * <Frame borderRadius={10} />
     *
     * // Radius with percentages
     * <Frame borderRadius="50%" />
     * ```
     * @public
     */
    borderRadius: number | string | MotionValue<number | string>;
    /**
     * Set the color for text elements inside of a `Frame`. By default, text within Frames will be rendered in black.
     * @remarks
     * ```jsx
     * <Frame color="#09F" />
     * ```
     * @public
     */
    color: string | MotionValue<string>;
    /**
     * Set the CSS overflow property. Set to `"visible"` by default.
     * @remarks
     * ```jsx
     * <Frame overflow="hidden" />
     * ```
     * @public
     */
    overflow: "visible" | "hidden";
    /**
     * Set the CSS box-shadow property.
     * @remarks
     * ```jsx
     * <Frame shadow="10px 5px 5px black" />
     * ```
     * @public
     */
    shadow: string | MotionValue<string>;
    /**
     * Position the children of the frame in 3D space. Set to `false` by default.
     * @remarks
     * ```jsx
     * <Frame preserve3d={true} />
     * ```
     * @public
     */
    preserve3d: boolean;
    /**
     * Sets whether the back face is visible when turned towards the user. Set to `true` by default.
     * @remarks
     * ```jsx
     * <Frame backfaceVisible={true} />
     * ```
     * @public
     */
    backfaceVisible: boolean;
}

declare interface WillChangeTransformProp {
    willChangeTransform?: boolean;
}

declare interface WithEventsProperties extends WithPanHandlers, WithTapHandlers, WithMouseHandlers, WithMouseWheelHandler {
}

/**
 * @public
 */
declare interface WithFractionOfFreeSpace {
    /* Excluded from this release type: freeSpaceInParent */
    /* Excluded from this release type: freeSpaceUnitDivisor */
}

declare interface WithMouseHandlers {
    onMouseDown: EventHandler;
    onClick: EventHandler;
    onMouseUp: EventHandler;
    onMouseEnter: EventHandler;
    onMouseLeave: EventHandler;
}

declare interface WithMouseWheelHandler {
    onMouseWheelStart: EventHandler;
    onMouseWheel: EventHandler;
    onMouseWheelEnd: EventHandler;
}

/* Excluded from this release type: WithNavigator */

declare interface WithOpacity {
    opacity: number | Animatable<number>;
}

/* Excluded from this release type: WithOverride */

/* Excluded from this release type: WithPackage */

declare interface WithPanHandlers {
    onPanStart: EventHandler;
    onPan: EventHandler;
    onPanEnd: EventHandler;
}

/* Excluded from this release type: WithPath */

declare interface WithTapHandlers {
    onTapStart: EventHandler;
    onTap: EventHandler;
    onTapEnd: EventHandler;
}

export * from "framer-motion";

export { }
