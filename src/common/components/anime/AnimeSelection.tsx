/**
 * @module common.components.anime
 */

import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import {AnimeInfo} from "dolos/grobber";
import * as React from "react";
import AnimeCard from "./AnimeCard";

/** @ignore */
const styles = () => createStyles({
    listTile: {
        overflow: "visible",
    },
});

export interface AnimeSelectionProps extends WithStyles<typeof styles, true> {
    anime: AnimeInfo[];
    currentUID?: string;
    onSelect?: (anime: AnimeInfo) => void;
}

export default withStyles(styles, {withTheme: true})(
    class AnimeSelection extends React.Component<AnimeSelectionProps> {
        onSelect(anime: AnimeInfo) {
            const {onSelect} = this.props;
            if (onSelect) onSelect(anime);
        }

        render(): React.ReactNode {
            const {classes, theme, anime, currentUID} = this.props;

            return (
                <GridList cellHeight="auto" cols={4} spacing={2 * theme.spacing.unit}>
                    {anime.map(anime => (
                        <GridListTile key={anime.uid} classes={{tile: classes.listTile}}>
                            <AnimeCard
                                animeInfo={anime}
                                current={currentUID === anime.uid}
                                onClick={() => this.onSelect(anime)}
                            />
                        </GridListTile>
                    ))}
                </GridList>
            );
        }
    }
);