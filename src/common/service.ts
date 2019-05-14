/**
 * @module common
 */

import {resolveSnackbarMessage, SnackbarMessage, SnackbarQueue} from "dolos/components";
import {createElement} from "react";
import {Subject} from "rxjs";
import {Type} from "../utils";
import {AnimePage, EpisodePage} from "./pages";
import ServicePage from "./service-page";
import State from "./state";

export default abstract class Service {
    public animePageType: Type<AnimePage<this>>;
    public episodePageType: Type<EpisodePage<this>>;

    public readonly state: State<this>;
    public readonly snackbarMessage$: Subject<SnackbarMessage>;

    protected constructor(serviceID: string, animePage: Type<AnimePage<any>>, episodePage: Type<EpisodePage<any>>) {
        this.state = new State(serviceID);

        this.snackbarMessage$ = new Subject();

        this.animePageType = animePage;
        this.episodePageType = episodePage;
    }

    public abstract async route(url: URL): Promise<void>;

    public async load(noRoute?: boolean) {
        const snackbar = await this.buildSnackbarQueue();

        await Promise.all([
            this.insertNoReferrerPolicy(),
            this.insertSnackbarQueue(snackbar),
        ]);

        if (!noRoute) await this.route(new URL(location.href));
    }

    // noinspection JSMethodCanBeStatic
    public async insertNoReferrerPolicy(): Promise<void> {
        const temp = document.createElement("template");
        temp.innerHTML = '<meta name="referrer" content="never">';
        const node = temp.content.firstElementChild;
        if (!node) throw new Error("Couldn't create template");

        document.head.appendChild(node);
        this.state.injected(node);
    }

    public async buildSnackbarQueue(): Promise<Element> {
        return this.state.renderWithTheme(
            createElement(SnackbarQueue, {
                snackbarMessage$: this.snackbarMessage$,
            }),
        );
    }

    // noinspection JSMethodCanBeStatic
    public async insertSnackbarQueue(snackbarQueue: Element): Promise<void> {
        document.body.appendChild(snackbarQueue);
    }

    public buildServicePage<T extends ServicePage<any>>(cls: Type<T>, memory?: { [key: string]: any }): T {
        const page = new cls(this);
        if (memory) {
            for (const [key, value] of Object.entries(memory))
                page.remember(key, value);
        }

        return page;
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] */
    public showSnackbar(message: SnackbarMessage): void {
        this.snackbarMessage$.next(message);
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant error */
    public showErrorSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "error"));
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant warning */
    public showWarningSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "warning"));
    }

    /** Shortcut for [[Service.snackbarMessage$.next]] with variant info */
    public showInfoSnackbar(message: string | SnackbarMessage): void {
        this.showSnackbar(resolveSnackbarMessage(message, "info"));
    }

    public async showAnimePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.animePageType, memory));
    }

    public async showEpisodePage(memory?: { [key: string]: any }) {
        await this.state.loadPage(this.buildServicePage(this.episodePageType, memory));
    }
}
