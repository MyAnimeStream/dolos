/**
 * @module options.tabs
 */

import CircularProgress from "@material-ui/core/CircularProgress";
import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import CheckIcon from "@material-ui/icons/Check";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import WifiIcon from "@material-ui/icons/Wifi";
import AwesomeDebouncePromise from "awesome-debounce-promise";
import axios from "axios";
import * as React from "react";
import {SettingsTabContent, SettingsTabContentProps} from "../settings-tab-content";
import _ = chrome.i18n.getMessage;

interface DebugState {
    invalidUrl?: string;
    checkingUrl: boolean;
}

interface GrobberUrlCheckResult {
    valid: boolean;
    hint?: "trailing_slash" | "version_mismatch" | "no_grobber";
}

export default class Debug extends SettingsTabContent<SettingsTabContentProps, DebugState> {

    public static async checkGrobberUrl(url: string): Promise<GrobberUrlCheckResult> {
        let resp;

        try {
            resp = await axios.get(url + "/dolos-info", {timeout: 1000});
        } catch (e) {
            const result: GrobberUrlCheckResult = {valid: false};

            if (url.endsWith("/")) {
                result.hint = "trailing_slash";
            }

            return result;
        }

        const data = resp.data;
        if (data.id !== "grobber") return {valid: false, hint: "no_grobber"};

        if (!data.version.startsWith("3.0")) {
            return {valid: false, hint: "version_mismatch"};
        }

        return {valid: true};
    }

    public changeGrobberUrl = AwesomeDebouncePromise(async (url: string) => {
        if (!url.match(/https?:\/\/.+/)) {
            this.setState({invalidUrl: _("options__grobber__url__invalid")});
            return;
        }

        this.setState({checkingUrl: true});

        const result = await Debug.checkGrobberUrl(url);
        if (result.valid) {
            await this.change("grobberUrl", url);
            this.setState({invalidUrl: undefined});
        } else {
            const text = `options__grobber__url__${result.hint || "test_failed"}`;
            this.setState({invalidUrl: _(text)});
        }

        this.setState({checkingUrl: false});
    }, 500);

    constructor(props: SettingsTabContentProps) {
        super(props);
        this.state = {
            checkingUrl: false,
        };
    }

    public render() {
        const config = this.props.config;
        const {checkingUrl, invalidUrl} = this.state;

        const onGrobberURLChange = (e: React.ChangeEvent<HTMLInputElement>) => this.changeGrobberUrl(e.target.value);

        let grobberURLAdornmentIcon;
        if (checkingUrl)
            grobberURLAdornmentIcon = (<CircularProgress/>);
        else if (invalidUrl)
            grobberURLAdornmentIcon = (<ErrorOutlineIcon/>);
        else
            grobberURLAdornmentIcon = (<CheckIcon/>);

        const grobberURLAdornment = (
            <InputAdornment position="end">
                {grobberURLAdornmentIcon}
            </InputAdornment>
        );

        return (
            <>
                <List subheader={<ListSubheader>{_("options__grobber__title")}</ListSubheader>}>
                    <ListItem>
                        <ListItemIcon>
                            <WifiIcon/>
                        </ListItemIcon>
                        <ListItemText primary={_("options__grobber__url")}/>
                        <ListItemSecondaryAction>
                            <FormControl>
                                <InputLabel htmlFor="grobber-url-input">{this.state.invalidUrl}</InputLabel>
                                <Input
                                    id="grobber-url-input"
                                    onChange={onGrobberURLChange}
                                    defaultValue={config.grobberUrl}
                                    error={Boolean(this.state.invalidUrl)}
                                    type="url"
                                    endAdornment={grobberURLAdornment}
                                />
                            </FormControl>
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </>
        );
    }
}
