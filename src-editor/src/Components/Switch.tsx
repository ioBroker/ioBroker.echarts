import React, { Component } from 'react';
import { type IobTheme } from '@iobroker/adapter-react-v5';

interface SwitchProps {
    checked: boolean;
    style?: React.CSSProperties;
    onChange: (checked: boolean) => void;
    theme: IobTheme;
    labelOn?: string;
    labelOff?: string;
    size?: 'small';
}

const WIDTH = 34;
const HANDLE_SIZE = 20;
const WIDTH_SMALL = 30;
const HANDLE_SIZE_SMALL = 15;

export default class Switch extends Component<SwitchProps> {
    render(): React.JSX.Element {
        const sw = (
            <div
                style={{
                    width: this.props.size === 'small' ? WIDTH_SMALL : WIDTH,
                    height: HANDLE_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                }}
                onClick={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.props.onChange(!this.props.checked);
                }}
            >
                <div
                    style={{
                        borderRadius: 15,
                        width: '100%',
                        height: (this.props.size === 'small' ? HANDLE_SIZE_SMALL : HANDLE_SIZE) * 0.7,
                        opacity: 0.6,
                        backgroundColor: this.props.checked ? this.props.theme.palette.primary.main : this.props.theme.palette.text.disabled,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: this.props.size === 'small' ? (HANDLE_SIZE - HANDLE_SIZE_SMALL) / 2 : 0,
                        left: this.props.checked ? (this.props.size === 'small' ? WIDTH_SMALL - HANDLE_SIZE_SMALL : WIDTH - HANDLE_SIZE) : 0,
                        transition: 'left 0.2s',
                        borderRadius: 50,
                        width: this.props.size === 'small' ? HANDLE_SIZE_SMALL : HANDLE_SIZE,
                        height: this.props.size === 'small' ? HANDLE_SIZE_SMALL : HANDLE_SIZE,
                        backgroundColor: this.props.checked
                            ? this.props.theme.palette.primary.main
                            : this.props.theme.palette.text.disabled,
                    }}
                />
            </div>
        );

        if (this.props.labelOn || this.props.labelOff) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {this.props.labelOff}
                    {sw}
                    {this.props.labelOn}
                </div>
            );
        }

        return sw;
    }
}
