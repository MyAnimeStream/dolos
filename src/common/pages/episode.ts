import * as React from "react";
import * as rxjs from "rxjs";
import {getThemeFor} from "../../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../../utils";
import {EpisodeEmbed, SkipButton, SnackbarMessage} from "../components";
import {cacheInMemory} from "../memory";
import {Episode, GrobberErrorType} from "../models";
import Service from "../service";
import ServicePage from "../service-page";
import AnimePage from "./anime";
import _ = chrome.i18n.getMessage;


export default abstract class EpisodePage<T extends Service> extends ServicePage<T> {
    private _animePage: AnimePage<T>;
    private epsWatchedSub: rxjs.Subscription;

    episodeBookmarked$: rxjs.BehaviorSubject<boolean>;
    snackbarMessage$: rxjs.Subject<SnackbarMessage>;


    constructor(service: T) {
        super(service);

        this.episodeBookmarked$ = new rxjs.BehaviorSubject(false);
        this.snackbarMessage$ = new rxjs.Subject();
    }

    get animePage(): AnimePage<T> {
        if (!this._animePage) this._animePage = this.buildAnimePage();

        return this._animePage;
    }

    set animePage(page: AnimePage<T>) {
        this._animePage = page;
    }

    abstract buildAnimePage(): AnimePage<T>;

    abstract async getEpisodeIndex(): Promise<number | null>;

    abstract async injectEmbed(embed: Element);

    abstract async nextEpisodeButton(): Promise<SkipButton | null>;

    abstract async showNextEpisode(): Promise<any>;

    abstract async prevEpisodeButton(): Promise<SkipButton | null>;

    abstract async showPrevEpisode(): Promise<any>;

    async setAnimeUID(uid: string) {
        await this.animePage.setAnimeUID(uid);
        await this.reload();
    }

    @cacheInMemory("episode")
    async getEpisode(): Promise<Episode | null> {
        let [uid, epIndex] = await Promise.all([this.animePage.getAnimeUID(), this.getEpisodeIndex()]);
        if (!uid || (!epIndex && epIndex !== 0)) return null;

        try {
            return await this.state.getEpisode(uid, epIndex);
        } catch (e) {
            if (e.name === GrobberErrorType.UidUnknown) {
                console.warn("Grobber didn't recognise uid, updating...");
                uid = await this.animePage.getAnimeUID(true);

                try {
                    return await this.state.getEpisode(uid, epIndex);
                } catch (e) {
                    console.error("couldn't get episode after updating uid", e);
                }
            }

            return null;
        }
    }

    async buildEmbed(): Promise<Element> {
        const el = document.createElement("div");
        reactRenderWithTheme(
            wrapSentryLogger(React.createElement(EpisodeEmbed, {episodePage: this})),
            getThemeFor(this.state.serviceId),
            el
        );

        return el;
    }

    async onEpisodeEnd() {
        const [config, epIndex, totalEpisodes] = await Promise.all([
            this.state.config, this.getEpisodeIndex(), this.animePage.getEpisodeCount()]);

        if (config.updateAnimeProgress)
            await this.markEpisodeWatched();

        if (epIndex + 1 < totalEpisodes)
            await this.showNextEpisode();
    }

    async markEpisodeWatched() {
        const [epIndex, canSetProgress] = await Promise.all([this.getEpisodeIndex(), this.animePage.canSetEpisodesWatched()]);
        if (!canSetProgress) return;

        if (!(epIndex || epIndex === 0)) {
            console.warn("Can't update anime progress, episodeIndex null!");
            return;
        }

        if (!await this.animePage.setEpisodesWatched(epIndex + 1))
            this.snackbarMessage$.next({message: _("episode__bookmark_failed"), type: "error"});
    }

    async markEpisodeUnwatched() {
        const [epIndex, canSetProgress] = await Promise.all([this.getEpisodeIndex(), this.animePage.canSetEpisodesWatched()]);
        if (!canSetProgress) return;

        if (!(epIndex || epIndex === 0)) {
            console.warn("Can't update anime progress, episodeIndex null!");
            return;
        }

        if (await this.animePage.setEpisodesWatched(epIndex)) this.episodeBookmarked$.next(false);
        else this.snackbarMessage$.next({message: _("episode__bookmark_failed"), type: "error"});
    }

    async _load() {
        await this.animePage.load();

        const [epIndex, epsWatched$] = await Promise.all([this.getEpisodeIndex(), this.animePage.getEpisodesWatched$()]);
        this.epsWatchedSub = epsWatched$.subscribe(epsWatched => this.episodeBookmarked$.next(epsWatched >= epIndex + 1));

        await this.injectEmbed(await this.buildEmbed());
    }

    async _unload() {
        if (this.epsWatchedSub) this.epsWatchedSub.unsubscribe();
        await this.animePage.unload();
        await super._unload()
    }

    async transitionTo(page?: ServicePage<T>): Promise<ServicePage<T> | void> {
        if (page instanceof AnimePage) {
            this.resetPage();
            return await this.animePage.transitionTo(page);
        } else if (page instanceof EpisodePage) {
            page.animePage = this.animePage;
            this.resetPage();
            await page.load();
            return;
        }

        await super.transitionTo(page);
    }
}