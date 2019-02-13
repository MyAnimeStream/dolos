/**
 * @module options
 * @preferred
 */

/** @ignore */

// since @material-ui/styles@3.0.4 or whatever version the style tag
// ordering is broken
import("./style-fix");

import * as React from "react";
import dolosTheme from "../theme";
import {reactRenderWithTheme, wrapSentryLogger} from "../utils";
import {Settings} from "./Settings";

chrome.tabs.query({active: true, currentWindow: true}, () => {
    reactRenderWithTheme(
        wrapSentryLogger(<Settings/>),
        dolosTheme,
        // @ts-ignore
        document.getElementById("root"),
    );
});
