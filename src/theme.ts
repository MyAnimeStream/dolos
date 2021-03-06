/**
 * Material UI themes for dolos.
 *
 * Instead of using these themes directly you should use
 * [[getThemeFor]].
 *
 * @see [[wrapWithTheme]] to easily apply a theme to a react component.
 *
 * @module theme
 */

/** @ignore */
import createMuiTheme, {Theme} from "@material-ui/core/styles/createMuiTheme";

/**
 * Theme used for "extension pages" such as options and popup.
 */
const mainTheme = createMuiTheme({
    palette: {
        primary: {
            main: "#43a047",
        },
        secondary: {
            main: "#cddc39",
        },
    },
});

export default mainTheme;

/**
 * Theme applied to Kitsu elements
 */
export const kitsuTheme = createMuiTheme({
    palette: {
        primary: {
            main: "#ef5350",
        },
        secondary: {
            main: "#4527a0",
        },
    },
});

/**
 * Theme applied to MyAnimeList elements
 */
export const malTheme = createMuiTheme({
    palette: {
        primary: {
            main: "#1d439b",
        },
        secondary: {
            main: "#4f74c8",
        },
    },
});

/**
 * Get the correct theme for a [[Service]] or the [[mainTheme]] if there is none.
 *
 * @param service - Service id as seen in [[State.serviceId]]
 */
export function getThemeFor(service: string): Theme {
    switch (service) {
        case "kitsu":
            return kitsuTheme;
        case "mal":
            return malTheme;

        default:
            return mainTheme;
    }
}
