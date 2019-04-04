/**
 * @module common/components/anime
 */

import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import makeStyles from "@material-ui/styles/makeStyles";
import {GrobberMedium} from "dolos/grobber";
import * as React from "react";
import _ = chrome.i18n.getMessage;

const useItemStyles = makeStyles({
    thumbnail: {
        objectFit: "cover",
        paddingTop: `${100 * 40 / 27}%`,
    },
});

export interface AnimeSelectionItemProps {
    medium: GrobberMedium;
    current?: boolean;
    onClick?: React.ReactEventHandler;
}

export function AnimeSelectionItem({medium, current, onClick}: AnimeSelectionItemProps) {
    const classes = useItemStyles();

    let episodeCountDisplay;

    if (medium.episodeCount !== undefined) {
        episodeCountDisplay = (
            <Typography>{_("anime__episode_count", [medium.episodeCount])}</Typography>
        );
    }

    return (
        <Card raised={current} onClick={onClick}>
            <CardActionArea>
                <CardMedia
                    className={classes.thumbnail}
                    image={medium.thumbnail}
                    title={medium.title}
                />
                <CardContent>
                    <Typography variant="h5" gutterBottom>{medium.title}</Typography>
                    {episodeCountDisplay}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

/** @ignore */
const styles = () => createStyles({
    listTile: {
        overflow: "visible",
    },
});

export interface AnimeSelectionProps extends WithStyles<typeof styles, true> {
    media: GrobberMedium[];
    currentUID?: string;
    onSelect?: (medium: GrobberMedium) => void;
}

// tslint:disable-next-line:variable-name
export const AnimeSearchSelection = withStyles(styles, {withTheme: true})(
    class extends React.Component<AnimeSelectionProps> {
        public onSelect(medium: GrobberMedium) {
            const {onSelect} = this.props;
            if (onSelect) onSelect(medium);
        }

        public render(): React.ReactNode {
            const {theme, media} = this.props;

            const renderAnimeTile = this.renderTile.bind(this);

            return (
                <GridList cellHeight="auto" cols={4} spacing={theme.spacing(2)}>
                    {media.map(renderAnimeTile)}
                </GridList>
            );
        }

        private renderTile(medium: GrobberMedium) {
            const {classes, currentUID} = this.props;

            const handleSelect = () => this.onSelect(medium);

            return (
                <GridListTile key={medium.uid} classes={{tile: classes.listTile}}>
                    <AnimeSelectionItem
                        medium={medium}
                        current={currentUID === medium.uid}
                        onClick={handleSelect}
                    />
                </GridListTile>
            );
        }
    },
);