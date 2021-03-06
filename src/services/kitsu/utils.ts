/**
 * Exposes functions related to internal Ember data.
 *
 * @module services/kitsu
 */

import axios, {AxiosRequestConfig} from "axios";
import {evaluateCode, formatCode, injectCode} from "dolos/inject";

/**
 * Perform a request to the Kitsu API.
 *
 * @param auth - Authorization header value
 * @param silent - ignore errors and return null
 */
export async function kitsuAPIRequest(method: string,
                                      endpoint: string,
                                      auth?: string,
                                      config?: AxiosRequestConfig,
                                      silent?: boolean): Promise<any | null> {
    config = config || {};
    config.method = method;
    config.url = "https://kitsu.io/api/edge" + endpoint;
    config.headers = {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    };

    if (auth) {
        config.headers.Authorization = auth;
    }

    try {
        return (await axios.request(config)).data;
    } catch (e) {
        if (silent) {
            console.error("Silent error in Kitsu API request:", endpoint, e);
            return null;
        } else throw e;
    }
}

/**
 * Code mix-in to get access to various Ember elements.
 * This code grants access to the following methods:
 * - `getApp(): Ember.Application` - Returns the Ember Application.
 * - `getContainer(): Ember.Container` - Returns the App's container
 * - `getQueryCache(): `kitsu.services.QueryCache - Get the query cache service
 */
const EMBER_BASE = `
const getApp = ${(
    () => {
        // @ts-ignore
        const {Namespace, Application} = window.Ember;
        return Namespace.NAMESPACES.find((namespace: any) => (namespace instanceof Application));
    }
).toString()};

const getContainer = () => getApp().__container__;
const getQueryCache = () => getContainer().lookup("service:query-cache");
`;

/**
 * Transition to the given ember view.
 */
export function transitionTo(view: string, ...args: any[]) {
    injectCode(EMBER_BASE +
        `getContainer().lookup("router:main").transitionTo("${view}", ${args.map(arg =>
            JSON.stringify(arg),
        )});`);
}

export async function getAccessToken(): Promise<string | undefined> {
    return await evaluateCode(EMBER_BASE
        + 'return getContainer().lookup("session:main").content.authenticated.access_token;');
}

/**
 * Code mix-in to set the Anime progress.
 * Requires the `getQueryCache` function from [[EMBER_BASE]] to be loaded.
 * The variables `animeId`, `userId`, and `progress` need to be set using [[formatCode]].
 *
 * @see [[setProgress]]
 */
const SET_PROGRESS = `
return await new Promise(${(
    // @ts-ignore
    res => getQueryCache()
        .query("library-entry", {filter: {animeId: "{{animeId}}", userId: "{{userId}}"}})
        .then((records: any) => {
            const entry = records.firstObject;
            entry.set("progress", "{{progress}}");
            return entry.save();
        })
        .then(() => res(true))
        .catch((reason: any) => res(reason))
).toString()});
`;

export async function setProgress(animeId: string, userId: string, progress: number): Promise<boolean> {
    const result = await evaluateCode(EMBER_BASE + formatCode(SET_PROGRESS, {animeId, userId, progress}));
    if (result !== true) {
        console.error("couldn't update progress", result);
        return false;
    }

    return true;
}

/**
 * Code mix-in to get the Anime progress.
 * Requires the `getQueryCache` function from [[EMBER_BASE]] to be loaded.
 * The variables `animeId`, and `userId` need to be set using [[formatCode]].
 *
 * @see [[getProgress]]
 */
const GET_PROGRESS = `
return await new Promise(${(
    // @ts-ignore
    res => getQueryCache()
        .query("library-entry", {filter: {animeId: "{{animeId}}", userId: "{{userId}}"}})
        .then((records: any) => {
            const entry = records.firstObject;
            res(entry.progress);
        })
        .catch((reason: any) => res(reason))
).toString()});
`;

export async function getProgress(animeId: string, userId: string): Promise<number | undefined> {
    const result = await evaluateCode(EMBER_BASE + formatCode(GET_PROGRESS, {animeId, userId}));
    if (isNaN(result)) return undefined;
    else return result;
}

/**
 * The Anime info used by Kitsu.
 */
export interface KitsuAnimeInfo {
    abbreviatedTitles: string[];
    ageRating: string;
    ageRatingGuide: string;
    averageRating: number;
    canonicalTitle: string;
    categories: string[];
    coverImage: string;
    coverImageTopOffset: number;
    endDate: string | null;
    episodeCount: number | null;
    episodeLength: number;
    favoritesCount: number;
    nsfw: boolean;
    popularityRank: number;
    posterImage: any;
    ratingFrequencies: any;
    ratingRank: number;
    slug: string;
    startDate: string;
    status: "upcoming" | "current" | "finished";
    streamingLinks: string[];
    subtype: string;
    synopsis: string;
    tba: string;
    titles: any;
    youtubeVideoId: string;
}

export async function getAnime(): Promise<KitsuAnimeInfo | undefined> {
    try {
        const result = await evaluateCode(EMBER_BASE
            + 'return getContainer().lookup("controller:anime/show").media;');
        return result as KitsuAnimeInfo;
    } catch (e) {
        console.warn("Couldn't get anime info from kitsu", e);
        return undefined;
    }
}
