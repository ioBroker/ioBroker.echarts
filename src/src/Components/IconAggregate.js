import React from 'react';

class IconAggregate extends React.Component {
    render() {
        return <svg onClick={e => this.props.onClick && this.props.onClick(e)} viewBox="0 0 32 32" width={this.props.width || 20} height={this.props.width || 20} xmlns="http://www.w3.org/2000/svg" className={this.props.className}>
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M16,9 L9,9 L9,16 L9,16 C9,19.8659932 12.1340068,23 16,23 L16,23 C19.8659932,23 23,19.8659932 23,16 C23,12.1340068 19.8659932,9 16,9 L16,9 Z M8,15 L15,15 L15,8 L15,8 C15,4.13400675 11.8659932,1 8,1 L8,1 C4.13400675,1 1,4.13400675 1,8 C1,11.8659932 4.13400675,15 8,15 L8,15 Z" transform="rotate(180 12 12)" />
        </svg>;
    }
}
export default IconAggregate;
