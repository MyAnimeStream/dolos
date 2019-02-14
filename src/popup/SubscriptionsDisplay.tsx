/**
 * @module popup
 */

import Avatar from "@material-ui/core/Avatar";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import {AnimeSubscriptionInfo} from "dolos/models";
import Store from "dolos/store";
import {useAnimeSubscriptions} from "dolos/subscriptions";
import * as React from "react";
import _ = chrome.i18n.getMessage;

/**
 * Props for [[SubscriptionItem]].
 * Only needs the [[AnimeSubscriptionInfo]].
 */
export interface SubscriptionItemProps {
    subscription: AnimeSubscriptionInfo;
}

/**
 * React component for displaying an anime Subscription.
 *
 * Shows a list item with the Anime's poster and the name.
 * Clicking on the item opens the anime page.
 * Comes with a button to unsubscribe.
 *
 * @see [[SubscriptionDisplay]] for a list of all active subscriptions
 */
export function SubscriptionItem({subscription}: SubscriptionItemProps) {
    function showAnime(): void {
        chrome.tabs.create({url: subscription.animeURL});
    }

    function unsubscribeAnime(): void {
        Store.getAnimeSubscriptions().then(subs => delete subs[subscription.identifier]);
    }

    let secondaryText = null;
    const unseenEpisodes = subscription.anime.episodes - subscription.episodesWatched;
    if (unseenEpisodes > 0) {
        secondaryText = _("subscriptions__unseen_episodes", [unseenEpisodes]);
    }

    return (
        <ListItem button onClick={showAnime}>
            <ListItemAvatar>
                <Avatar alt={subscription.anime.title} src={subscription.anime.thumbnail}/>
            </ListItemAvatar>
            <ListItemText
                primary={subscription.anime.title}
                secondary={secondaryText}
            />
            <ListItemSecondaryAction>
                <IconButton aria-label={_("subscriptions__remove_subscription")} onClick={unsubscribeAnime}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );
}

/**
 * A React component for displaying Dolos subscriptions.
 *
 * Shows a list of active subscriptions where each item is a [[SubscriptionItem]].
 * If there are subscriptions with new episodes, the list is separated in two
 * by subheaders for animes with new episodes and those without.
 *
 * The list also comes with a header.
 */
function SubscriptionsDisplay() {
    const subscriptions = useAnimeSubscriptions();

    // TODO: center circular progress
    if (subscriptions === undefined)
        return <CircularProgress/>;

    let animeSubscriptions;
    if (Object.values(subscriptions).length > 0) {
        const featuredSubs: AnimeSubscriptionInfo[] = [];
        const subs: AnimeSubscriptionInfo[] = [];

        Object.values(subscriptions).forEach(sub => {
            const unseenEpisodes = sub.anime.episodes - sub.episodesWatched;
            if (unseenEpisodes > 0)
                featuredSubs.push(sub);
            else
                subs.push(sub);
        });

        if (featuredSubs.length > 0)
            animeSubscriptions = (
                <>
                    <ListSubheader>{_("subscriptions__anime__featured_subscriptions")}</ListSubheader>
                    {featuredSubs.map(sub => <SubscriptionItem key={sub.identifier} subscription={sub}/>)}

                    <ListSubheader>{_("subscriptions__anime__all_subscriptions")}</ListSubheader>
                    {subs.map(sub => <SubscriptionItem key={sub.identifier} subscription={sub}/>)}
                </>
            );
        else
            animeSubscriptions = (
                <>
                    {subs.map(sub => <SubscriptionItem key={sub.identifier} subscription={sub}/>)}
                </>
            );

    } else {
        animeSubscriptions = <Typography>{_("subscriptions__no_active_subscriptions")}</Typography>;
    }

    return (
        <>
            <Typography variant="h5">{_("subscriptions__anime__subscription_header")}</Typography>
            <List>
                {animeSubscriptions}
            </List>
        </>
    );
}

export default SubscriptionsDisplay;
