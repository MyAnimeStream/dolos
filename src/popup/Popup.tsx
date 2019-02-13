/**
 * @module popup
 */

import AppBar from "@material-ui/core/AppBar";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CssBaseline from "@material-ui/core/CssBaseline";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import Hidden from "@material-ui/core/Hidden";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import {fade} from "@material-ui/core/styles/colorManipulator";
import {Theme} from "@material-ui/core/styles/createMuiTheme";
import createStyles from "@material-ui/core/styles/createStyles";
import withStyles, {WithStyles} from "@material-ui/core/styles/withStyles";
import SwipeableDrawer from "@material-ui/core/SwipeableDrawer";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import FeedbackIcon from "@material-ui/icons/Feedback";
import HelpIcon from "@material-ui/icons/Help";
import HistoryIcon from "@material-ui/icons/History";
import HomeIcon from "@material-ui/icons/Home";
import MenuIcon from "@material-ui/icons/Menu";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import SettingsIcon from "@material-ui/icons/Settings";
import SubscriptionsIcon from "@material-ui/icons/Subscriptions";
import {GitHubIcon} from "dolos/assets";
import * as info from "dolos/info";
import {getAnimeSubsWithUnseenEpsCount$} from "dolos/subscriptions";
import {getBackgroundWindow} from "dolos/utils";
import * as React from "react";
import {NavLink, Redirect, Route, RouteComponentProps, Switch, withRouter} from "react-router-dom";
import * as rxjs from "rxjs";
import Changelog from "./ChangelogDisplay";
import SubscriptionsDisplay from "./SubscriptionsDisplay";
import _ = chrome.i18n.getMessage;

/** @ignore */
const styles = (theme: Theme) => {
    const drawerWidth = 240;

    const grow = {
        flexGrow: 1,
    };

    return createStyles({
        activeDrawerLink: {
            "& *": {
                color: theme.palette.primary.main,
            },
            "backgroundColor": fade(theme.palette.primary.main, .12),
        },
        appBar: {
            marginLeft: drawerWidth,
            [theme.breakpoints.up("sm")]: {
                width: `calc(100% - ${drawerWidth}px)`,
            },
        },
        badge: {
            paddingRight: 2 * theme.spacing.unit,
        },
        buttonIconLeft: {
            marginRight: theme.spacing.unit,
        },
        content: {
            flexGrow: 1,
            padding: 2 * theme.spacing.unit,
        },
        drawer: {
            [theme.breakpoints.up("sm")]: {
                flexShrink: 0,
                width: drawerWidth,
            },
        },
        drawerPaper: {
            width: drawerWidth,
        },
        grow,
        menuButton: {
            marginRight: 20,
            [theme.breakpoints.up("sm")]: {
                display: "none",
            },
        },
        root: {
            display: "flex",
            minHeight: 400,
            minWidth: 300,
        },
        toolbar: theme.mixins.toolbar,
    });
};

/**
 * Props for [[Popup]].
 */
type PopupProps = WithStyles<typeof styles, true> & RouteComponentProps<any>;

interface PopupState {
    drawerOpen: boolean;
    changelogBadgeVisible: boolean;
    unseenEpisodesCount: number;
}

/**
 * Main react component for the extension popup.
 */
class Popup extends React.Component<PopupProps, PopupState> {
    public hasNewVersionSub?: rxjs.Subscription;
    public unseenEpsCountSub?: rxjs.Subscription;

    constructor(props: PopupProps) {
        super(props);
        this.state = {
            changelogBadgeVisible: false,
            drawerOpen: false,
            unseenEpisodesCount: 0,
        };
    }

    public componentWillUnmount() {
        if (this.hasNewVersionSub) this.hasNewVersionSub.unsubscribe();
        if (this.unseenEpsCountSub) this.unseenEpsCountSub.unsubscribe();
    }

    public async componentDidMount() {
        const {history} = this.props;

        const background = await getBackgroundWindow();
        this.hasNewVersionSub = background.hasNewVersion$.subscribe(changelogBadgeVisible => {
            if (changelogBadgeVisible) history.push("/changelog");
            this.setState({changelogBadgeVisible});
        });

        const animeSubsWithUnseenEpsCount$ = await getAnimeSubsWithUnseenEpsCount$();
        this.unseenEpsCountSub = animeSubsWithUnseenEpsCount$
            .subscribe(unseenEpisodesCount => this.setState({unseenEpisodesCount}));
    }

    public toggleDrawer() {
        this.setState({drawerOpen: !this.state.drawerOpen});
    }

    public renderHome = () => {
        return (
            <Typography paragraph>
                Hello World!
            </Typography>);
    };

    public renderSubscriptions = () => {
        return <SubscriptionsDisplay/>;
    };

    public renderChangelog = () => {
        return <Changelog/>;
    };

    public renderFeedback = () => {
        const {classes} = this.props;

        const handleOpenIssues = () => window.open("https://github.com/MyAnimeStream/dolos/issues");

        return (
            <Card>
                <CardActionArea>
                    <CardContent>
                        <Typography gutterBottom variant="h5">GitHub Issues</Typography>
                        <Typography>{_("popup__feedback__github_issues__text")}</Typography>
                    </CardContent>
                </CardActionArea>
                <CardActions>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenIssues}
                    >
                        <GitHubIcon className={classes.buttonIconLeft}/>
                        {_("popup__feedback__github_issues__action")}
                    </Button>
                </CardActions>
            </Card>
        );
    };

    public renderHelp = () => {
        return (
            <Typography paragraph>
                There's no help yet, sorry boi!
                Version {info.getVersion()}
            </Typography>
        );
    };

    public render() {
        const {classes, theme} = this.props;
        const {changelogBadgeVisible, unseenEpisodesCount} = this.state;

        const getLink = (target: string) => (props: {}) => (
            <NavLink
                to={target}
                activeClassName={classes.activeDrawerLink}
                {...props}
            />
        );

        const homeLink = getLink("/home");
        const subscriptionsLink = getLink("/subscriptions");
        const changelogLink = getLink("/changelog");

        const feedbackLink = getLink("/feedback");
        const helpLink = getLink("/help");

        const handleOpenOptions = () => chrome.runtime.openOptionsPage();

        const drawer = (
            <>
                <List>
                    <ListItem button component={homeLink}>
                        <ListItemIcon><HomeIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__home")}/>
                    </ListItem>
                    <ListItem button component={subscriptionsLink}>
                        <ListItemIcon><SubscriptionsIcon/></ListItemIcon>
                        <ListItemText>
                            <Badge
                                badgeContent={unseenEpisodesCount}
                                max={9}
                                className={classes.badge}
                                color="secondary"
                            >
                                {_("popup__nav__subscriptions")}
                            </Badge>
                        </ListItemText>
                    </ListItem>
                    <ListItem button component={changelogLink}>
                        <ListItemIcon><HistoryIcon/></ListItemIcon>
                        <ListItemText>
                            <Badge
                                variant="dot"
                                invisible={!changelogBadgeVisible}
                                className={classes.badge}
                                color="secondary"
                            >
                                {_("popup__nav__changelog")}
                            </Badge>
                        </ListItemText>
                    </ListItem>
                </List>
                <Divider/>
                <List>
                    <ListItem button onClick={handleOpenOptions}>
                        <ListItemIcon><SettingsIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__settings")}/>
                        <OpenInNewIcon fontSize="small"/>
                    </ListItem>
                    <ListItem button component={feedbackLink}>
                        <ListItemIcon><FeedbackIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__feedback")}/>
                    </ListItem>
                    <ListItem button component={helpLink}>
                        <ListItemIcon><HelpIcon/></ListItemIcon>
                        <ListItemText primary={_("popup__nav__help")}/>
                    </ListItem>
                </List>
            </>
        );

        const handleToggleDrawer = this.toggleDrawer.bind(this);

        return (
            <div className={classes.root}>
                <CssBaseline/>

                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            className={classes.menuButton}
                            onClick={handleToggleDrawer}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" color="inherit" className={classes.grow}>
                            {_("ext_name")}
                        </Typography>
                    </Toolbar>
                </AppBar>

                <nav className={classes.drawer}>
                    <Hidden smUp implementation="css">
                        <SwipeableDrawer
                            variant="temporary"
                            anchor={theme.direction === "rtl" ? "right" : "left"}
                            open={this.state.drawerOpen}
                            onOpen={handleToggleDrawer}
                            onClick={handleToggleDrawer}
                            onClose={handleToggleDrawer}
                            classes={{paper: classes.drawerPaper}}
                            ModalProps={{keepMounted: true}}
                        >
                            {drawer}
                        </SwipeableDrawer>
                    </Hidden>

                    <Hidden xsDown implementation="css">
                        <Drawer
                            classes={{paper: classes.drawerPaper}}
                            variant="permanent"
                            open
                        >
                            {drawer}
                        </Drawer>
                    </Hidden>
                </nav>

                <main className={classes.content}>
                    <div className={classes.toolbar}/>

                    <Switch>
                        <Redirect exact path="/" to="/home"/>
                        <Route path="/home" render={this.renderHome}/>
                        <Route path="/subscriptions" render={this.renderSubscriptions}/>
                        <Route path="/changelog" render={this.renderChangelog}/>

                        <Route path="/feedback" render={this.renderFeedback}/>
                        <Route path="/help" render={this.renderHelp}/>
                    </Switch>
                </main>
            </div>
        );
    }
}

export default withStyles(styles, {withTheme: true})(withRouter(Popup));
