/**
 * @module common.components.anime
 */

/** @ignore */

import {Theme} from "@material-ui/core/styles";
import {makeStyles} from "@material-ui/styles";
import {AnimePage} from "dolos/common/pages";
import * as React from "react";
import {ContinueWatchingButton, SubscriptionToggle} from ".";

/** @ignore */
const useStyles = makeStyles((theme: Theme) => ({
    bar: {
        display: "flex",
        width: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        "& > * + *": {
            marginTop: theme.spacing.unit,
        },
    },
}));

export interface AnimeStatusBarProps {
    animePage: AnimePage<any>;
}

/** Simple component combining [[ContinueWatchingButton]] and [[SubscriptionToggle]] */
export function AnimeStatusBar({animePage}: AnimeStatusBarProps) {
    const classes = useStyles();

    return (
        <span className={classes.bar}>
            <ContinueWatchingButton animePage={animePage}/>
            <SubscriptionToggle animePage={animePage}/>
        </span>
    )
}