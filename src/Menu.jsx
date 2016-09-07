import React from 'react';

import Constants from './Constants';
import {getTMPDOMRoot, extend} from './Utils';

const SEP = '__seperator__';
let Menu = React.createClass({

    getInitialState() {
        return {
            show: false
        };
    },

    isRootMenu() {
        return !this.props.parent;
    },

    showAt(pos, config) {
        var left = pos.left,
            top = pos.top,
            docLeft = 0,
            docTop = 0,
            width = this.getDOMNode().getBoundingClientRect().width;
        if (!config) {
            // relative position of the menu's parent menu item
            var rect = this.getDOMNode().parentNode.getBoundingClientRect();
            var {left: docLeft, top: docTop} = rect;
        }

        if (docLeft + left + width > document.body.scrollLeft + window.innerWidth) {
            // can't fit right, horizontal invert
            left = config ? document.documentElement.clientWidth - width : -width + 2;
        } else {
            left += 2;
        }

        var allShow = true;
        var allItem = 0;
        var visibleItem = 0;
        var firstItem = 0;

        var options = config ? config.options : this.props.options,
            menuHeight = options.length * Constants.config.menuItemHeight;
        if (docTop + top + menuHeight > document.body.scrollTop + window.innerHeight) {
            // can't fit bottom, vertical invert
            var submenuSize = options.filter((opt)=> opt != SEP).length;
            var menuHeight = (this.isRootMenu() ? submenuSize : submenuSize - 1) * Constants.config.menuItemHeight
                + (options.length - submenuSize) * Constants.config.menuSepItemHeight;
            //top -= menuHeight;

            if(top-menuHeight < 0) {
                allShow = false;
                allItem = submenuSize;
                visibleItem = Math.floor((top-30)/(Constants.config.menuItemHeight+1));
                firstItem = 0;
                top = 2;
            }
            else {
                top -= menuHeight;
            }
        }

        this.setState(extend({
            show: true,
            allShow: allShow,
            allItem: allItem,
            visibleItem: visibleItem,
            firstItem: firstItem,
            position: {
                top: top,
                left: left
            }
        }, config));
    },

    show() {
        this.setState({
            show: true
        });
    },

    hide(all) {
        this.setState({
            show: false
        });

        if (all) {
            var parent = this.props.parent;
            parent && parent.hide(all);
        }
    },

    onClickArrow(evt) {
        evt.stopPropagation();
        var idx = parseInt(evt.currentTarget.dataset['idx']);
        var firstItem = this.state.firstItem;
        var visibleItem = this.state.visibleItem;
        var allItem = this.state.allItem;
        if(idx==1 && firstItem>0)
            firstItem--;
        if(idx==2 && firstItem+visibleItem<allItem)
            firstItem++;

        this.setState({
            firstItem: firstItem
        });
    },

    onClick(evt) {
        evt.stopPropagation();

        // iteratively get click path
        var idx = parseInt(evt.currentTarget.dataset['idx']),
            curr = this,
            parent = this.props.parent,
            path = [idx];
        while (parent) {
            path.push(curr.props.idx);
            curr = parent;
            parent = parent.props.parent;
        }
        path.reverse();

        // call callback
        // after iteration, curr is the root menu
        var cbk = curr.state.cbk;
        cbk(this.getItem(idx), path, curr.state.data);

        this.hide(true);
    },

    getItem(idx) {
        var options = this.state.options || this.props.options;
        return options[idx];
        // return typeof label == 'object'? label.title : label;
    },

    onMaskClick() {
        this.hide();
    },

    onHoverMenuItem(evt) {
        var idx = evt.currentTarget.dataset['idx'],
            com = this.refs[`child-${idx}`],
            $node = this.getDOMNode();

        if (com) com.showAt({
            left: $node.clientWidth - 4,
            top: 0
        });
    },

    onLeaveMenuItem(evt) {
        var idx = evt.currentTarget.dataset['idx'],
            com = this.refs[`child-${idx}`];
        if (com) com.hide();
    },

    render() {
        var className = 'Menu ' + (this.state.show ? 'Show' : 'Hide'),
            options = this.state.options || this.props.options,
            position = this.state.position || this.props.position;
        var items = [];
        var contents;
        var state = this.state;
        if (options) {
            var arrowT,arrowB;
           // var icoT = (state.firstItem<=0?''<i className="ico top"></i>);
            if(!state.allShow) {
                arrowT = state.firstItem<=0?(<li className="arrow"></li>):(<li className="arrow" data-idx='1' onClick={this.onClickArrow}><i className="ico top"></i></li>);
                arrowB = (state.firstItem+state.visibleItem)>=state.allItem?(<li className="arrow"></li>):(<li className="arrow" data-idx='2' onClick={this.onClickArrow}><i className="ico bottom"></i></li>);
            }
            var idx = 0, item;
            var itemIdx = 0,itemNum = 0;

            if(!state.allShow) items.push(arrowT);

            for(var idx=0;idx<options.length;idx++) {
                var option = options[idx];
                var label = option,
                    style,
                    chose,
                    subMenu;
                if(label!=SEP) itemIdx++;
                if(!state.allShow && itemIdx<=state.firstItem)
                    continue;

                if (label == SEP) {
                    item = (<li className="sep" />);
                    items.push(item);
                    continue;
                }

                if (typeof option == 'object') {
                    label = [option.title];
                    chose = option.chose;
                    if (Array.isArray(option.children)) {
                        label.push(<i className="ico gt"></i>);
                        subMenu = <Menu ref={`child-${idx}`} idx={idx} options={option.children} parent={this}/>;
                    }
                    style = option.style;
                }

                item = (<li
                    className={chose ? "on" : ""}
                    key={idx}
                    style={style}
                    data-idx={idx}
                    onMouseEnter={this.onHoverMenuItem}
                    onMouseLeave={this.onLeaveMenuItem}
                    onClick={this.onClick}>{label}{subMenu}</li>);

                itemNum++;
                items.push(item);

                if(!state.allShow && itemNum>=state.visibleItem)
                    break;
            }

            if(!state.allShow) items.push(arrowB);

            /*var items = options.map((item)=> {
                // For seperators, index should not increase
                [item, idx] = this.renderMenuItem(item, idx);
                return item;
            });*/

            contents = (
                <div className="list">
                    <ul>{items}</ul>
                </div>
            );
        }
        if (!this.state.show) {
            position = {
                top: -9999,
                left: -9999
            }
        }
        return (
            <div className={className} style={position}>
                {contents}
            </div>
        );
    }
});


export default {
    init: function (options) {
        var $root = getTMPDOMRoot();
        var menu = <Menu options={options}/>;
        this.menu = React.render(menu, $root);
        this.hide = this.hide.bind(this);
        this.click = this.click.bind(this);
    },

    show: function (evt, config, cbk) {
        if (!this.menu) {
            // singleton, lazy initialization
            this.init(config.options);
        }

        var position;
        if (config.position) {
            position = config.position;
        } else {
            var x = document.body.scrollLeft + evt.clientX,
                y = document.body.scrollTop + evt.clientY;

            position = {
                top: y,
                left: x
            };
        }

        this.menu.showAt(position, {
            options: config.options,
            data: config.data,
            cbk: (...args)=> {
                // this is triggered when menu item is clicked
                cbk.apply(null, args);
                document.removeEventListener('click', this.click);
            }
        });
        document.addEventListener('click', this.click);
    },

    click(evt) {
        if (!this.menu) return;
        var $menunode =  this.menu.getDOMNode();
        var x = document.body.scrollLeft + evt.clientX,
            y = document.body.scrollTop + evt.clientY;

        var menux = $menunode.offsetLeft,
            menuy = $menunode.offsetTop;
        var menuw = $menunode.offsetWidth,
            menuh = $menunode.offsetHeight;
        
        if(x<menux || x>(menux+menuw) || y<menuy || y>(menuy+menuh))
            this.hide();
    },

    hide() {
        if (!this.menu) return;
        this.menu.hide();
        document.removeEventListener('click', this.click);

        var $root = this.menu.getDOMNode().parentNode;
        React.unmountComponentAtNode($root);
        $root.parentNode.removeChild($root);
        this.menu = null;
    }
};
