/**
 * @module kitsu
 */

import Kitsu from ".";
import {cacheInStateMemory} from "../common";
import {AnimePage} from "../common/pages";
import {cacheInMemory} from "../memory";
import {retryUntil, waitUntilExists} from "../utils";
import {
    getAccessToken,
    getAnime,
    getProgress,
    KitsuAnimeInfo,
    kitsuAPIRequest,
    setProgress,
    transitionTo
} from "./utils";

export default class KitsuAnimePage extends AnimePage<Kitsu> {
    @cacheInMemory("animeIdentifier")
    async getAnimeIdentifier(): Promise<string | undefined> {
        const match = location.pathname.match(/\/anime\/([^\/]+)(?:\/)?/);
        if (!match) return;
        return match[1];
    }

    @cacheInMemory("animeSearchQuery")
    async getAnimeSearchQuery(): Promise<string | undefined> {
        return (await waitUntilExists("meta[property=\"og:title\"]")).getAttribute("content") || undefined;
    }

    @cacheInStateMemory("accessToken")
    async getAccessToken(): Promise<string | undefined> {
        return await retryUntil(() => getAccessToken(), 200, 2500);
    }

    @cacheInMemory("animeId")
    async getAnimeId(): Promise<string | undefined> {
        const resp = await kitsuAPIRequest("GET", "/anime", undefined, {
            params: {
                "fields[anime]": "id",
                "filter[slug]": await this.getAnimeIdentifier()
            }
        }, true);
        if (!resp) return;

        const results = resp.data;
        if (!results) return;

        return results[0].id;
    }

    async getAnimeURL(): Promise<string | undefined> {
        const animeID = await this.getAnimeIdentifier();
        if (!animeID) return;

        return `https://kitsu.io/anime/${animeID}`;
    }

    @cacheInMemory("kitsuAnime")
    async getKitsuAnimeInfo(): Promise<KitsuAnimeInfo | undefined> {
        return await retryUntil(getAnime, 200, 2500);
    }

    @cacheInStateMemory("userId")
    async getUserId(): Promise<string | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        const resp = await kitsuAPIRequest("GET", "/users", `Bearer ${token}`, {
            params: {
                "fields[users]": "id",
                "filter[self]": "true"
            }
        }, true);

        return resp && resp.data[0].id;
    }

    @cacheInMemory("libraryEntryId")
    async getLibraryEntryId(): Promise<string | null> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return null;

        const resp = await kitsuAPIRequest("GET", "/library-entries", undefined, {
            params: {
                "fields[anime]": "id",
                "filter[userId]": userId,
                "filter[animeId]": animeId
            }
        }, true);

        return resp && resp.data[0].id;
    }

    async canSetEpisodesWatched(): Promise<boolean> {
        // is the user logged-in?
        return !!await this.getUserId();
    }

    protected async _setEpisodesWatched(progress: number): Promise<boolean> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return false;

        return await setProgress(animeId, userId, progress);
    }

    async getEpisodeURL(episode: number): Promise<string> {
        const slug = await this.getAnimeIdentifier();
        return new URL(`/anime/${slug}/episodes/${episode + 1}`, location.origin).toString();
    }

    async showEpisode(episodeIndex: number) {
        transitionTo("anime.show.episodes.show", episodeIndex + 1);
    }

    @cacheInMemory("episodesWatched")
    async _getEpisodesWatched(): Promise<number | undefined> {
        const [animeId, userId] = await Promise.all([this.getAnimeId(), this.getUserId()]);
        if (!(animeId && userId)) return;

        return await getProgress(animeId, userId);
    }

    @cacheInMemory("episodeCount")
    async getEpisodeCount(): Promise<number | undefined> {
        const anime = await this.getKitsuAnimeInfo();
        if (anime) {
            const epCount = anime.episodeCount;
            if (epCount !== null) return epCount;
        }

        return;
    }

    async injectAnimeStatusBar(element: Element) {
        element.setAttribute("style", "margin-top: 16px");

        (await waitUntilExists("span.media-poster"))
            .insertAdjacentElement("afterend", element);

        this.injected(element);
    }
}