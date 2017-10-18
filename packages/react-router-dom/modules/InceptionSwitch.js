import React from 'react'
import matchPath from './matchPath'
import {Switch} from "react-router-dom";

export default class InceptionSwitch extends Switch {


    searchPath(children, elem, globalPath) {

        if(globalPath === undefined) {
            globalPath = "";
        }

        children.map((element) => {

            if (elem.match === null && React.isValidElement(element)) {

                const { path: pathProp, exact, strict, sensitive, from } = element.props;
                let path = pathProp || from;

                if(path === undefined) {
                    path = "";
                }

                if (path[0] !== "/") path = "/" + path;
                path = globalPath + path;

                if (element.props.children) {
                    this.searchPath(element.props.children, elem, path);

                    // Found Route
                    if(elem.match !== null) {
                        const computedElem = React.cloneElement(elem.child, { key: 1, location, computedMatch: elem.match });
                        elem.child = React.createElement(element.type, element.props, [computedElem]);
                    }

                } else {
                    elem.child = element;
                    elem.match = path ? matchPath(location.pathname, {path, exact, strict, sensitive}) : route.match
                }
            }
        });

    }


    render() {

        const { route } = this.context.router;
        const { children } = this.props;
        const location = this.props.location || route.location;

        let elem = {
            match: null,
            child: null
        };

        this.searchPath(children, elem);

        return elem.match ? React.cloneElement(elem.child, { location, computedMatch: elem.match }) : null
    }
}