import {Theme} from "@material-ui/core/styles/createMuiTheme";
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import * as React from "react";
import * as ReactDOM from "react-dom";

export async function artificialDelay<T>(delay: number, ...waiting: Promise<T>[]): Promise<T[]> {
    const timeout = new Promise(res => setTimeout(res, delay)) as Promise<T>;
    waiting.push(timeout);

    const res = await Promise.all(waiting);
    return res.slice(0, res.length - 1)
}

export function reactRenderWithTeme(component: React.ReactNode, theme: Theme, renderTarget: Element) {
    // @ts-ignore
    const wrapped = React.createElement(MuiThemeProvider, {theme}, component);
    ReactDOM.render(wrapped, renderTarget);
}

export interface Type<T> extends Function {
    new(...args: any[]): T;
}