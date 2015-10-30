import React from 'react';
import Constants from './Constants';
import {getTMPDOMRoot} from './Utils';


let Popup = React.createClass({
    statics: {
        show: function (args) {
            var $root = getTMPDOMRoot(args.modal);
            var popup = (
                <Popup title={args.title} animated={args.animated} onBtnClick={args.btnClicked}>
                    {args.content}
                </Popup>
            );
            React.render(popup, $root)
        }
    },

    getDefaultProps() {
        return {
            animated: true,
            buttons: ['OK', 'Cancel']
        };
    },

    getInitialState() {
        return {
            hide: false
        };
    },

    renderButtons() {
        return this.props.buttons.map((label, i)=> {
            return <button key={i} data-idx={i} onClick={this.onBtnClick}>{label}</button>;
        });
    },

    onBtnClick(evt) {
        var idx = evt.target.dataset.idx;
        if (typeof this.props.onBtnClick == 'function') {
            var ret = this.props.onBtnClick(idx, this.props.buttons[idx]);
            if (ret) {
                this.close();
            }
        }
    },

    close(evt) {
        if (this.props.animated) {
            this.setState({
                hide: true
            });
            setTimeout(()=> {
                this.destroy();
            }, Constants.config.transitionDuration);
        } else {
            this.destroy();
        }
    },

    destroy() {
        var $root = this.getDOMNode().parentNode;
        React.unmountComponentAtNode($root);
        $root.parentNode.removeChild($root);
    },

    render() {
        var className = 'Popup',
            props = this.props,
            state = this.state;
        if (props.className) {
            className += ' ' + props.className;
        }
        if (props.animated) {
            className += state.hide ? ' hide' : ' show';
        }

        var buttons = this.renderButtons();
        return (
            <div id={props.id} className={className}>
                <div className="Title">
                    <h1>{props.title}</h1>
                    <a className="Close" onClick={this.close} href="javascript:;">&times;</a>
                </div>
                <div className="Content">{props.children}</div>
                <div className="Footer">{buttons}</div>
            </div>
        );
    }
});

export default Popup;