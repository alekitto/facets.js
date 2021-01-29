(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FacetsJs = {}));
}(this, (function (exports) { 'use strict';

    const en = {
        'is equal to': 'is equal to',
        'is not equal to': 'is not equal to',
        'contains': 'contains',
        'does not contain': 'does not contain',
        'starts with': 'starts with',
        'ends with': 'ends with',
        'is empty': 'is empty',
        'is not empty': 'is not empty',
        'greater than': 'greater than',
        'greater than or equal': 'greater than or equal',
        'less than': 'less than',
        'less than or equal': 'less than or equal',
        'loading': 'Loading...',
        'error while loading options': 'Error while loading options',
        Yes: 'Yes',
        No: 'No',
    };

    const it = {
        'is equal to': 'è uguale a',
        'is not equal to': 'non è uguale a',
        'contains': 'contiene',
        'does not contain': 'non contiene',
        'starts with': 'inizia per',
        'ends with': 'finisce con',
        'is empty': 'è vuoto',
        'is not empty': 'non è vuoto',
        'greater than': 'è maggiore di',
        'greater than or equal': 'è maggiore o uguale a',
        'less than': 'è minore di',
        'less than or equal': 'è minore o uguale a',
        'loading': 'Caricamento...',
        'error while loading options': 'Errore durante il caricamento delle opzioni',
        Yes: 'Sì',
        No: 'No',
    };

    (function (FieldType) {
        FieldType["TEXT"] = "text";
        FieldType["BOOLEAN"] = "boolean";
        FieldType["NUMBER"] = "number";
        FieldType["DATE"] = "date";
        FieldType["TIME"] = "time";
        FieldType["CHOICE"] = "choice";
    })(exports.FieldType || (exports.FieldType = {}));

    class Field {
        constructor(props) {
            this.name = props.name;
            this.label = props.label ?? props.name;
            this.type = props.type;
            this.choices = props.type === exports.FieldType.CHOICE ? props.choices : null;
        }
    }

    /**
     * @author Toru Nagashima <https://github.com/mysticatea>
     * @copyright 2015 Toru Nagashima. All rights reserved.
     * See LICENSE file in root directory for full license.
     */
    /**
     * @typedef {object} PrivateData
     * @property {EventTarget} eventTarget The event target.
     * @property {{type:string}} event The original event object.
     * @property {number} eventPhase The current event phase.
     * @property {EventTarget|null} currentTarget The current event target.
     * @property {boolean} canceled The flag to prevent default.
     * @property {boolean} stopped The flag to stop propagation.
     * @property {boolean} immediateStopped The flag to stop propagation immediately.
     * @property {Function|null} passiveListener The listener if the current listener is passive. Otherwise this is null.
     * @property {number} timeStamp The unix time.
     * @private
     */

    /**
     * Private data for event wrappers.
     * @type {WeakMap<Event, PrivateData>}
     * @private
     */
    const privateData = new WeakMap();

    /**
     * Cache for wrapper classes.
     * @type {WeakMap<Object, Function>}
     * @private
     */
    const wrappers = new WeakMap();

    /**
     * Get private data.
     * @param {Event} event The event object to get private data.
     * @returns {PrivateData} The private data of the event.
     * @private
     */
    function pd(event) {
        const retv = privateData.get(event);
        console.assert(
            retv != null,
            "'this' is expected an Event object, but got",
            event
        );
        return retv
    }

    /**
     * https://dom.spec.whatwg.org/#set-the-canceled-flag
     * @param data {PrivateData} private data.
     */
    function setCancelFlag(data) {
        if (data.passiveListener != null) {
            if (
                typeof console !== "undefined" &&
                typeof console.error === "function"
            ) {
                console.error(
                    "Unable to preventDefault inside passive event listener invocation.",
                    data.passiveListener
                );
            }
            return
        }
        if (!data.event.cancelable) {
            return
        }

        data.canceled = true;
        if (typeof data.event.preventDefault === "function") {
            data.event.preventDefault();
        }
    }

    /**
     * @see https://dom.spec.whatwg.org/#interface-event
     * @private
     */
    /**
     * The event wrapper.
     * @constructor
     * @param {EventTarget} eventTarget The event target of this dispatching.
     * @param {Event|{type:string}} event The original event to wrap.
     */
    function Event(eventTarget, event) {
        privateData.set(this, {
            eventTarget,
            event,
            eventPhase: 2,
            currentTarget: eventTarget,
            canceled: false,
            stopped: false,
            immediateStopped: false,
            passiveListener: null,
            timeStamp: event.timeStamp || Date.now(),
        });

        // https://heycam.github.io/webidl/#Unforgeable
        Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });

        // Define accessors
        const keys = Object.keys(event);
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            if (!(key in this)) {
                Object.defineProperty(this, key, defineRedirectDescriptor(key));
            }
        }
    }

    // Should be enumerable, but class methods are not enumerable.
    Event.prototype = {
        /**
         * The type of this event.
         * @type {string}
         */
        get type() {
            return pd(this).event.type
        },

        /**
         * The target of this event.
         * @type {EventTarget}
         */
        get target() {
            return pd(this).eventTarget
        },

        /**
         * The target of this event.
         * @type {EventTarget}
         */
        get currentTarget() {
            return pd(this).currentTarget
        },

        /**
         * @returns {EventTarget[]} The composed path of this event.
         */
        composedPath() {
            const currentTarget = pd(this).currentTarget;
            if (currentTarget == null) {
                return []
            }
            return [currentTarget]
        },

        /**
         * Constant of NONE.
         * @type {number}
         */
        get NONE() {
            return 0
        },

        /**
         * Constant of CAPTURING_PHASE.
         * @type {number}
         */
        get CAPTURING_PHASE() {
            return 1
        },

        /**
         * Constant of AT_TARGET.
         * @type {number}
         */
        get AT_TARGET() {
            return 2
        },

        /**
         * Constant of BUBBLING_PHASE.
         * @type {number}
         */
        get BUBBLING_PHASE() {
            return 3
        },

        /**
         * The target of this event.
         * @type {number}
         */
        get eventPhase() {
            return pd(this).eventPhase
        },

        /**
         * Stop event bubbling.
         * @returns {void}
         */
        stopPropagation() {
            const data = pd(this);

            data.stopped = true;
            if (typeof data.event.stopPropagation === "function") {
                data.event.stopPropagation();
            }
        },

        /**
         * Stop event bubbling.
         * @returns {void}
         */
        stopImmediatePropagation() {
            const data = pd(this);

            data.stopped = true;
            data.immediateStopped = true;
            if (typeof data.event.stopImmediatePropagation === "function") {
                data.event.stopImmediatePropagation();
            }
        },

        /**
         * The flag to be bubbling.
         * @type {boolean}
         */
        get bubbles() {
            return Boolean(pd(this).event.bubbles)
        },

        /**
         * The flag to be cancelable.
         * @type {boolean}
         */
        get cancelable() {
            return Boolean(pd(this).event.cancelable)
        },

        /**
         * Cancel this event.
         * @returns {void}
         */
        preventDefault() {
            setCancelFlag(pd(this));
        },

        /**
         * The flag to indicate cancellation state.
         * @type {boolean}
         */
        get defaultPrevented() {
            return pd(this).canceled
        },

        /**
         * The flag to be composed.
         * @type {boolean}
         */
        get composed() {
            return Boolean(pd(this).event.composed)
        },

        /**
         * The unix time of this event.
         * @type {number}
         */
        get timeStamp() {
            return pd(this).timeStamp
        },

        /**
         * The target of this event.
         * @type {EventTarget}
         * @deprecated
         */
        get srcElement() {
            return pd(this).eventTarget
        },

        /**
         * The flag to stop event bubbling.
         * @type {boolean}
         * @deprecated
         */
        get cancelBubble() {
            return pd(this).stopped
        },
        set cancelBubble(value) {
            if (!value) {
                return
            }
            const data = pd(this);

            data.stopped = true;
            if (typeof data.event.cancelBubble === "boolean") {
                data.event.cancelBubble = true;
            }
        },

        /**
         * The flag to indicate cancellation state.
         * @type {boolean}
         * @deprecated
         */
        get returnValue() {
            return !pd(this).canceled
        },
        set returnValue(value) {
            if (!value) {
                setCancelFlag(pd(this));
            }
        },

        /**
         * Initialize this event object. But do nothing under event dispatching.
         * @param {string} type The event type.
         * @param {boolean} [bubbles=false] The flag to be possible to bubble up.
         * @param {boolean} [cancelable=false] The flag to be possible to cancel.
         * @deprecated
         */
        initEvent() {
            // Do nothing.
        },
    };

    // `constructor` is not enumerable.
    Object.defineProperty(Event.prototype, "constructor", {
        value: Event,
        configurable: true,
        writable: true,
    });

    // Ensure `event instanceof window.Event` is `true`.
    if (typeof window !== "undefined" && typeof window.Event !== "undefined") {
        Object.setPrototypeOf(Event.prototype, window.Event.prototype);

        // Make association for wrappers.
        wrappers.set(window.Event.prototype, Event);
    }

    /**
     * Get the property descriptor to redirect a given property.
     * @param {string} key Property name to define property descriptor.
     * @returns {PropertyDescriptor} The property descriptor to redirect the property.
     * @private
     */
    function defineRedirectDescriptor(key) {
        return {
            get() {
                return pd(this).event[key]
            },
            set(value) {
                pd(this).event[key] = value;
            },
            configurable: true,
            enumerable: true,
        }
    }

    /**
     * Get the property descriptor to call a given method property.
     * @param {string} key Property name to define property descriptor.
     * @returns {PropertyDescriptor} The property descriptor to call the method property.
     * @private
     */
    function defineCallDescriptor(key) {
        return {
            value() {
                const event = pd(this).event;
                return event[key].apply(event, arguments)
            },
            configurable: true,
            enumerable: true,
        }
    }

    /**
     * Define new wrapper class.
     * @param {Function} BaseEvent The base wrapper class.
     * @param {Object} proto The prototype of the original event.
     * @returns {Function} The defined wrapper class.
     * @private
     */
    function defineWrapper(BaseEvent, proto) {
        const keys = Object.keys(proto);
        if (keys.length === 0) {
            return BaseEvent
        }

        /** CustomEvent */
        function CustomEvent(eventTarget, event) {
            BaseEvent.call(this, eventTarget, event);
        }

        CustomEvent.prototype = Object.create(BaseEvent.prototype, {
            constructor: { value: CustomEvent, configurable: true, writable: true },
        });

        // Define accessors.
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            if (!(key in BaseEvent.prototype)) {
                const descriptor = Object.getOwnPropertyDescriptor(proto, key);
                const isFunc = typeof descriptor.value === "function";
                Object.defineProperty(
                    CustomEvent.prototype,
                    key,
                    isFunc
                        ? defineCallDescriptor(key)
                        : defineRedirectDescriptor(key)
                );
            }
        }

        return CustomEvent
    }

    /**
     * Get the wrapper class of a given prototype.
     * @param {Object} proto The prototype of the original event to get its wrapper.
     * @returns {Function} The wrapper class.
     * @private
     */
    function getWrapper(proto) {
        if (proto == null || proto === Object.prototype) {
            return Event
        }

        let wrapper = wrappers.get(proto);
        if (wrapper == null) {
            wrapper = defineWrapper(getWrapper(Object.getPrototypeOf(proto)), proto);
            wrappers.set(proto, wrapper);
        }
        return wrapper
    }

    /**
     * Wrap a given event to management a dispatching.
     * @param {EventTarget} eventTarget The event target of this dispatching.
     * @param {Object} event The event to wrap.
     * @returns {Event} The wrapper instance.
     * @private
     */
    function wrapEvent(eventTarget, event) {
        const Wrapper = getWrapper(Object.getPrototypeOf(event));
        return new Wrapper(eventTarget, event)
    }

    /**
     * Get the immediateStopped flag of a given event.
     * @param {Event} event The event to get.
     * @returns {boolean} The flag to stop propagation immediately.
     * @private
     */
    function isStopped(event) {
        return pd(event).immediateStopped
    }

    /**
     * Set the current event phase of a given event.
     * @param {Event} event The event to set current target.
     * @param {number} eventPhase New event phase.
     * @returns {void}
     * @private
     */
    function setEventPhase(event, eventPhase) {
        pd(event).eventPhase = eventPhase;
    }

    /**
     * Set the current target of a given event.
     * @param {Event} event The event to set current target.
     * @param {EventTarget|null} currentTarget New current target.
     * @returns {void}
     * @private
     */
    function setCurrentTarget(event, currentTarget) {
        pd(event).currentTarget = currentTarget;
    }

    /**
     * Set a passive listener of a given event.
     * @param {Event} event The event to set current target.
     * @param {Function|null} passiveListener New passive listener.
     * @returns {void}
     * @private
     */
    function setPassiveListener(event, passiveListener) {
        pd(event).passiveListener = passiveListener;
    }

    /**
     * @typedef {object} ListenerNode
     * @property {Function} listener
     * @property {1|2|3} listenerType
     * @property {boolean} passive
     * @property {boolean} once
     * @property {ListenerNode|null} next
     * @private
     */

    /**
     * @type {WeakMap<object, Map<string, ListenerNode>>}
     * @private
     */
    const listenersMap = new WeakMap();

    // Listener types
    const CAPTURE = 1;
    const BUBBLE = 2;
    const ATTRIBUTE = 3;

    /**
     * Check whether a given value is an object or not.
     * @param {any} x The value to check.
     * @returns {boolean} `true` if the value is an object.
     */
    function isObject(x) {
        return x !== null && typeof x === "object" //eslint-disable-line no-restricted-syntax
    }

    /**
     * Get listeners.
     * @param {EventTarget} eventTarget The event target to get.
     * @returns {Map<string, ListenerNode>} The listeners.
     * @private
     */
    function getListeners(eventTarget) {
        const listeners = listenersMap.get(eventTarget);
        if (listeners == null) {
            throw new TypeError(
                "'this' is expected an EventTarget object, but got another value."
            )
        }
        return listeners
    }

    /**
     * Get the property descriptor for the event attribute of a given event.
     * @param {string} eventName The event name to get property descriptor.
     * @returns {PropertyDescriptor} The property descriptor.
     * @private
     */
    function defineEventAttributeDescriptor(eventName) {
        return {
            get() {
                const listeners = getListeners(this);
                let node = listeners.get(eventName);
                while (node != null) {
                    if (node.listenerType === ATTRIBUTE) {
                        return node.listener
                    }
                    node = node.next;
                }
                return null
            },

            set(listener) {
                if (typeof listener !== "function" && !isObject(listener)) {
                    listener = null; // eslint-disable-line no-param-reassign
                }
                const listeners = getListeners(this);

                // Traverse to the tail while removing old value.
                let prev = null;
                let node = listeners.get(eventName);
                while (node != null) {
                    if (node.listenerType === ATTRIBUTE) {
                        // Remove old value.
                        if (prev !== null) {
                            prev.next = node.next;
                        } else if (node.next !== null) {
                            listeners.set(eventName, node.next);
                        } else {
                            listeners.delete(eventName);
                        }
                    } else {
                        prev = node;
                    }

                    node = node.next;
                }

                // Add new value.
                if (listener !== null) {
                    const newNode = {
                        listener,
                        listenerType: ATTRIBUTE,
                        passive: false,
                        once: false,
                        next: null,
                    };
                    if (prev === null) {
                        listeners.set(eventName, newNode);
                    } else {
                        prev.next = newNode;
                    }
                }
            },
            configurable: true,
            enumerable: true,
        }
    }

    /**
     * Define an event attribute (e.g. `eventTarget.onclick`).
     * @param {Object} eventTargetPrototype The event target prototype to define an event attrbite.
     * @param {string} eventName The event name to define.
     * @returns {void}
     */
    function defineEventAttribute(eventTargetPrototype, eventName) {
        Object.defineProperty(
            eventTargetPrototype,
            `on${eventName}`,
            defineEventAttributeDescriptor(eventName)
        );
    }

    /**
     * Define a custom EventTarget with event attributes.
     * @param {string[]} eventNames Event names for event attributes.
     * @returns {EventTarget} The custom EventTarget.
     * @private
     */
    function defineCustomEventTarget(eventNames) {
        /** CustomEventTarget */
        function CustomEventTarget() {
            EventTarget.call(this);
        }

        CustomEventTarget.prototype = Object.create(EventTarget.prototype, {
            constructor: {
                value: CustomEventTarget,
                configurable: true,
                writable: true,
            },
        });

        for (let i = 0; i < eventNames.length; ++i) {
            defineEventAttribute(CustomEventTarget.prototype, eventNames[i]);
        }

        return CustomEventTarget
    }

    /**
     * EventTarget.
     *
     * - This is constructor if no arguments.
     * - This is a function which returns a CustomEventTarget constructor if there are arguments.
     *
     * For example:
     *
     *     class A extends EventTarget {}
     *     class B extends EventTarget("message") {}
     *     class C extends EventTarget("message", "error") {}
     *     class D extends EventTarget(["message", "error"]) {}
     */
    function EventTarget() {
        /*eslint-disable consistent-return */
        if (this instanceof EventTarget) {
            listenersMap.set(this, new Map());
            return
        }
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
            return defineCustomEventTarget(arguments[0])
        }
        if (arguments.length > 0) {
            const types = new Array(arguments.length);
            for (let i = 0; i < arguments.length; ++i) {
                types[i] = arguments[i];
            }
            return defineCustomEventTarget(types)
        }
        throw new TypeError("Cannot call a class as a function")
        /*eslint-enable consistent-return */
    }

    // Should be enumerable, but class methods are not enumerable.
    EventTarget.prototype = {
        /**
         * Add a given listener to this event target.
         * @param {string} eventName The event name to add.
         * @param {Function} listener The listener to add.
         * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
         * @returns {void}
         */
        addEventListener(eventName, listener, options) {
            if (listener == null) {
                return
            }
            if (typeof listener !== "function" && !isObject(listener)) {
                throw new TypeError("'listener' should be a function or an object.")
            }

            const listeners = getListeners(this);
            const optionsIsObj = isObject(options);
            const capture = optionsIsObj
                ? Boolean(options.capture)
                : Boolean(options);
            const listenerType = capture ? CAPTURE : BUBBLE;
            const newNode = {
                listener,
                listenerType,
                passive: optionsIsObj && Boolean(options.passive),
                once: optionsIsObj && Boolean(options.once),
                next: null,
            };

            // Set it as the first node if the first node is null.
            let node = listeners.get(eventName);
            if (node === undefined) {
                listeners.set(eventName, newNode);
                return
            }

            // Traverse to the tail while checking duplication..
            let prev = null;
            while (node != null) {
                if (
                    node.listener === listener &&
                    node.listenerType === listenerType
                ) {
                    // Should ignore duplication.
                    return
                }
                prev = node;
                node = node.next;
            }

            // Add it.
            prev.next = newNode;
        },

        /**
         * Remove a given listener from this event target.
         * @param {string} eventName The event name to remove.
         * @param {Function} listener The listener to remove.
         * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
         * @returns {void}
         */
        removeEventListener(eventName, listener, options) {
            if (listener == null) {
                return
            }

            const listeners = getListeners(this);
            const capture = isObject(options)
                ? Boolean(options.capture)
                : Boolean(options);
            const listenerType = capture ? CAPTURE : BUBBLE;

            let prev = null;
            let node = listeners.get(eventName);
            while (node != null) {
                if (
                    node.listener === listener &&
                    node.listenerType === listenerType
                ) {
                    if (prev !== null) {
                        prev.next = node.next;
                    } else if (node.next !== null) {
                        listeners.set(eventName, node.next);
                    } else {
                        listeners.delete(eventName);
                    }
                    return
                }

                prev = node;
                node = node.next;
            }
        },

        /**
         * Dispatch a given event.
         * @param {Event|{type:string}} event The event to dispatch.
         * @returns {boolean} `false` if canceled.
         */
        dispatchEvent(event) {
            if (event == null || typeof event.type !== "string") {
                throw new TypeError('"event.type" should be a string.')
            }

            // If listeners aren't registered, terminate.
            const listeners = getListeners(this);
            const eventName = event.type;
            let node = listeners.get(eventName);
            if (node == null) {
                return true
            }

            // Since we cannot rewrite several properties, so wrap object.
            const wrappedEvent = wrapEvent(this, event);

            // This doesn't process capturing phase and bubbling phase.
            // This isn't participating in a tree.
            let prev = null;
            while (node != null) {
                // Remove this listener if it's once
                if (node.once) {
                    if (prev !== null) {
                        prev.next = node.next;
                    } else if (node.next !== null) {
                        listeners.set(eventName, node.next);
                    } else {
                        listeners.delete(eventName);
                    }
                } else {
                    prev = node;
                }

                // Call this listener
                setPassiveListener(
                    wrappedEvent,
                    node.passive ? node.listener : null
                );
                if (typeof node.listener === "function") {
                    try {
                        node.listener.call(this, wrappedEvent);
                    } catch (err) {
                        if (
                            typeof console !== "undefined" &&
                            typeof console.error === "function"
                        ) {
                            console.error(err);
                        }
                    }
                } else if (
                    node.listenerType !== ATTRIBUTE &&
                    typeof node.listener.handleEvent === "function"
                ) {
                    node.listener.handleEvent(wrappedEvent);
                }

                // Break if `event.stopImmediatePropagation` was called.
                if (isStopped(wrappedEvent)) {
                    break
                }

                node = node.next;
            }
            setPassiveListener(wrappedEvent, null);
            setEventPhase(wrappedEvent, 0);
            setCurrentTarget(wrappedEvent, null);

            return !wrappedEvent.defaultPrevented
        },
    };

    // `constructor` is not enumerable.
    Object.defineProperty(EventTarget.prototype, "constructor", {
        value: EventTarget,
        configurable: true,
        writable: true,
    });

    // Ensure `eventTarget instanceof window.EventTarget` is `true`.
    if (
        typeof window !== "undefined" &&
        typeof window.EventTarget !== "undefined"
    ) {
        Object.setPrototypeOf(EventTarget.prototype, window.EventTarget.prototype);
    }

    const createButton = (className, label, icon) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.classList.add(className);
        if (icon) {
            el.title = label;
            const iconEl = document.createElement('i');
            iconEl.classList.add('facets-ico-' + icon);
            el.appendChild(iconEl);
        }
        else {
            el.innerText = label;
        }
        return el;
    };

    const TEXT_OPERATORS = [
        ['eq', 'is equal to'],
        ['neq', 'is not equal to'],
        ['ct', 'contains'],
        ['nct', 'does not contain'],
        ['sw', 'starts with'],
        ['ew', 'ends with'],
        ['null', 'is empty'],
        ['notnull', 'is not empty'],
    ];
    const NUMBER_OPERATORS = [
        ['eq', 'is equal to'],
        ['neq', 'is not equal to'],
        ['gt', 'greater than'],
        ['gte', 'greater than or equal'],
        ['lt', 'less than'],
        ['lte', 'less than or equal'],
        ['null', 'is empty'],
        ['notnull', 'is not empty'],
    ];
    class Filter extends EventTarget {
        constructor(fields, appendChild, locale = en, show = true) {
            super();
            this.fields = fields;
            this.locale = locale;
            this._field = null;
            this.operatorSelect = null;
            this.otherInput = null;
            const container = document.createElement('div');
            container.classList.add('filter-container');
            container.style.display = 'flex';
            this.container = appendChild(container);
            const fieldSelect = this.fieldSelect = this.container.appendChild(document.createElement('select'));
            let emptyOption = fieldSelect.appendChild(document.createElement('option'));
            fieldSelect.value = '';
            for (const field of fields) {
                const option = document.createElement('option');
                option.value = field.name;
                option.innerText = field.label;
                fieldSelect.appendChild(option);
            }
            this.specContainer = this.container.appendChild(document.createElement('div'));
            this.specContainer.style.display = 'flex';
            this.label = this.container.appendChild(document.createElement('span'));
            this.label.classList.add('filter-label');
            this.label.style.display = 'none';
            const removeFilterBtn = this.container.appendChild(createButton('remove-filter-btn', 'Remove filter', 'minus'));
            removeFilterBtn.addEventListener('click', () => {
                const e = new CustomEvent('remove', {
                    detail: {
                        target: this,
                    },
                });
                this.dispatchEvent(e);
            });
            const applyFilterBtn = this.container.appendChild(createButton('apply-filter-btn', 'Apply filter', 'checkmark'));
            applyFilterBtn.style.display = 'none';
            applyFilterBtn.addEventListener('click', () => this.applyFilter());
            fieldSelect.addEventListener('change', e => {
                e.stopPropagation();
                if (null !== emptyOption) {
                    fieldSelect.removeChild(emptyOption);
                    emptyOption = null;
                }
                const field = fields.find(f => f.name === e.target.value);
                if (!field) {
                    e.preventDefault();
                    return;
                }
                applyFilterBtn.style.display = 'block';
                this._field = field;
                this._initFilter();
            });
            fieldSelect.focus();
            this.hide = () => {
                fieldSelect.style.display = 'none';
                this.specContainer.style.display = 'none';
                applyFilterBtn.style.display = 'none';
                removeFilterBtn.style.display = 'none';
                this.label.style.display = 'inline-block';
            };
            this.show = () => {
                const event = new CustomEvent('open', {
                    detail: {
                        target: this,
                    },
                });
                this.dispatchEvent(event);
                if (event.defaultPrevented) {
                    return;
                }
                fieldSelect.style.display = 'block';
                this.specContainer.style.display = 'flex';
                applyFilterBtn.style.display = this._field ? 'block' : 'none';
                removeFilterBtn.style.display = 'block';
                this.label.style.display = 'none';
            };
            this.label.addEventListener('click', () => this.show());
            if (show) {
                setTimeout(() => this.show(), 0);
            }
            this.container.addEventListener('keydown', e => {
                if ('Enter' === e.key || 13 === e.which || 13 === e.keyCode) {
                    this.applyFilter();
                    return false;
                }
                return true;
            }, { capture: true });
        }
        get field() {
            return this._field ? this._field.name : '';
        }
        set field(field) {
            const fieldObject = this.fields.find(f => f.name === field);
            if (!fieldObject) {
                return;
            }
            this._field = fieldObject;
            this.fieldSelect.value = fieldObject.name;
            this._initFilter();
        }
        get operator() {
            return this._operator ? this._operator() : ['eq', this.locale['is equal to']];
        }
        set operator(op) {
            if (this.operatorSelect) {
                this.operatorSelect.value = op[0];
            }
            this._operator = () => op;
        }
        get value() {
            return this.other ? this.other() : null;
        }
        set value(value) {
            if (this.otherInput) {
                this.otherInput.value = value;
            }
            this.other = () => value;
        }
        createTextFilter() {
            const operatorSelect = this.operatorSelect = this.specContainer.appendChild(document.createElement('select'));
            for (const op of TEXT_OPERATORS) {
                const option = document.createElement('option');
                option.value = op[0];
                option.innerText = this.locale[op[1]] ?? op[1];
                operatorSelect.appendChild(option);
            }
            const comparandInput = this.otherInput = this.specContainer.appendChild(document.createElement('input'));
            comparandInput.type = 'text';
            comparandInput.value = '';
            operatorSelect.addEventListener('change', e => {
                const operator = e.target.value;
                comparandInput.style.display = 'null' === operator || 'notnull' === operator ? 'none' : 'block';
            });
            this._operator = () => {
                const value = operatorSelect.value;
                return TEXT_OPERATORS.find(o => o[0] === value);
            };
            this.other = () => comparandInput.value;
        }
        createNumberFilter(type) {
            const operatorSelect = this.operatorSelect = this.specContainer.appendChild(document.createElement('select'));
            for (const op of NUMBER_OPERATORS) {
                const option = document.createElement('option');
                option.value = op[0];
                option.innerText = this.locale[op[1]] ?? op[1];
                operatorSelect.appendChild(option);
            }
            const comparandInput = this.otherInput = this.specContainer.appendChild(document.createElement('input'));
            comparandInput.value = '';
            if (exports.FieldType.NUMBER === type) {
                comparandInput.type = 'number';
            }
            else if (exports.FieldType.DATE === type) {
                comparandInput.type = 'date';
            }
            else {
                comparandInput.type = 'time';
            }
            operatorSelect.addEventListener('change', e => {
                const operator = e.target.value;
                comparandInput.style.display = 'null' === operator || 'notnull' === operator ? 'none' : 'block';
            });
            this._operator = () => {
                const value = operatorSelect.value;
                return NUMBER_OPERATORS.find(o => o[0] === value);
            };
            this.other = () => comparandInput.value;
        }
        createBooleanFilter() {
            const comparandSelect = this.otherInput = this.specContainer.appendChild(document.createElement('select'));
            const values = [
                ['1', 'Yes'],
                ['0', 'No'],
            ];
            for (const op of values) {
                const option = document.createElement('option');
                option.value = op[0];
                option.innerText = this.locale[op[1]] ?? op[1];
                comparandSelect.appendChild(option);
            }
            this._operator = () => ['eq', 'is equal to'];
            this.other = () => comparandSelect.value;
        }
        createChoiceFilter() {
            const comparandSelect = this.otherInput = this.specContainer.appendChild(document.createElement('select'));
            let choices = this._field?.choices ?? [];
            const loadChoices = (choices) => {
                comparandSelect.innerHTML = '';
                for (const choice of choices) {
                    const option = document.createElement('option');
                    option.value = choice.value;
                    option.innerText = choice.label;
                    comparandSelect.appendChild(option);
                }
            };
            if ('function' === typeof choices) {
                choices = choices();
            }
            if ('then' in choices) {
                const loadingOption = document.createElement('option');
                loadingOption.value = '';
                loadingOption.innerText = this.locale['loading'];
                comparandSelect.appendChild(loadingOption);
                choices.then(loadChoices, () => {
                    loadingOption.innerText = this.locale['error while loading options'];
                });
            }
            else {
                loadChoices(choices);
            }
            this._operator = () => ['eq', 'is equal to'];
            this.other = () => comparandSelect.value;
        }
        _initFilter() {
            const field = this._field;
            if (!field) {
                return;
            }
            this.specContainer.innerHTML = '';
            this.operatorSelect = null;
            this.otherInput = null;
            switch (field.type) {
                case exports.FieldType.TEXT:
                    this.createTextFilter();
                    break;
                case exports.FieldType.NUMBER:
                case exports.FieldType.DATE:
                case exports.FieldType.TIME:
                    this.createNumberFilter(field.type);
                    break;
                case exports.FieldType.BOOLEAN:
                    this.createBooleanFilter();
                    break;
                case exports.FieldType.CHOICE:
                    this.createChoiceFilter();
                    break;
            }
        }
        /**
         * @internal
         */
        applyFilter() {
            if (!this._operator || !this.other || !this._field) {
                return;
            }
            const operator = this._operator();
            const other = this.other();
            this.label.innerText = (this._field.label ?? this._field.name) + ' ' + this.locale[operator[1]];
            if ('null' !== operator[0] && 'notnull' !== operator[0]) {
                this.label.innerText += ' "' + other + '"';
            }
            this.hide();
            this.dispatchEvent(new CustomEvent('apply-filter', {
                detail: {
                    filter: this,
                    value: {
                        field: this._field.name,
                        operator: operator[0],
                        value: other,
                    },
                },
            }));
        }
    }

    const DEFAULT_OPTIONS = {
        classPrefix: '',
        locale: en,
        dropdownLoader: function* (value, instance) {
            const textFields = instance.fields.filter(f => f.type === exports.FieldType.TEXT);
            for (const field of textFields) {
                yield {
                    label: field.label + ' ' + instance.locale['contains'] + ' "' + value + '"',
                    filter: {
                        field: field.name,
                        operator: ['ct', instance.locale['contains']],
                        value,
                    },
                };
            }
        },
    };
    function isKeyboardEvent(e) {
        return 'key' in e || 'which' in e || 'keyCode' in e;
    }
    class Facets extends EventTarget {
        constructor(element, options = {}) {
            super();
            this.element = element;
            this.fields = [];
            this.filters = [];
            this._appliedFilters = new Set();
            this.dropdownSelected = -1;
            if ('DIV' !== element.tagName) {
                throw new TypeError('Facets.js only supports div tags');
            }
            if (!options.fields || !Array.isArray(options.fields) || 0 === options.fields.length) {
                throw new Error('At least one field is required');
            }
            this.options = Object.assign({}, options, DEFAULT_OPTIONS);
            if (this.options.classPrefix) {
                this.options.classPrefix += '-';
            }
            this.locale = this.options.locale;
            this.fields = Object.freeze(options.fields.map(f => new Field(f)));
            this.element.innerHTML = '';
            this.element.classList.add(this.options.classPrefix + 'facets-js-wrapper');
            this.element.style.display = 'flex';
            this.element.style.flexWrap = '1';
            // @todo: add default filters
            const newFilterBtn = createButton('new-filter-btn', 'Add filter', 'plus');
            this.newFilterBtn = this.element.appendChild(newFilterBtn);
            this.newFilterBtn.addEventListener('click', () => this.createFilter());
            const inputBox = document.createElement('input');
            inputBox.type = 'text';
            inputBox.style.minWidth = '10rem';
            inputBox.style.flexGrow = '1';
            inputBox.style.border = '0';
            this.inputBox = this.element.appendChild(inputBox);
            this.inputBox.addEventListener('input', this.onInput.bind(this));
            this.inputBox.addEventListener('keydown', this.onInput.bind(this));
            this.inputBox.addEventListener('keypress', this.onInput.bind(this));
            this.inputBox.addEventListener('click', this.onInput.bind(this));
            this.dropdown = document.body.appendChild(document.createElement('div'));
            this.dropdown.classList.add('facets-js-dropdown', 'facets-js-hide');
        }
        destroy() {
            document.body.removeChild(this.dropdown);
        }
        get appliedFilters() {
            return [...this._appliedFilters.values()];
        }
        onInput(e) {
            const value = e.target.value;
            if (!value) {
                this.dropdown.classList.add('facets-js-hide');
                return;
            }
            const rect = this.inputBox.getBoundingClientRect();
            const choices = [];
            for (const choice of this.options.dropdownLoader(value, this)) {
                choices.push(choice);
            }
            const applyFilter = (choice) => {
                const choiceFilter = choice.filter;
                const filter = this.createFilter(false);
                filter.field = choiceFilter.field;
                filter.operator = choiceFilter.operator;
                filter.value = choiceFilter.value;
                this.filters.push(filter);
                filter.applyFilter();
                this.dropdown.classList.add('facets-js-hide');
                this.inputBox.value = '';
            };
            if (isKeyboardEvent(e)) {
                if ('Enter' === e.key || 13 === e.which || 13 === e.keyCode) {
                    if (-1 !== this.dropdownSelected) {
                        applyFilter(choices[this.dropdownSelected]);
                    }
                    else if (this.inputBox.value !== '') {
                        this.dropdown.classList.remove('facets-js-hide');
                    }
                    return;
                }
                else if ('ArrowUp' === e.key || 38 === e.which || 38 === e.keyCode) {
                    if (-1 === this.dropdownSelected || 0 === this.dropdownSelected) {
                        this.dropdownSelected = this.dropdown.children.length - 1;
                    }
                    else {
                        this.dropdownSelected--;
                    }
                    Array.prototype.slice.call(this.dropdown.children).forEach(e => e.classList.remove('selected'));
                    this.dropdown.children[this.dropdownSelected].classList.add('selected');
                    return;
                }
                else if ('ArrowDown' === e.key || 40 === e.which || 40 === e.keyCode) {
                    if (-1 === this.dropdownSelected || this.dropdown.children.length - 1 === this.dropdownSelected) {
                        this.dropdownSelected = 0;
                    }
                    else {
                        this.dropdownSelected++;
                    }
                    Array.prototype.slice.call(this.dropdown.children).forEach(e => e.classList.remove('selected'));
                    this.dropdown.children[this.dropdownSelected].classList.add('selected');
                    return;
                }
                else if ('Escape' === e.key || 27 === e.which || 27 === e.keyCode) {
                    this.dropdownSelected = -1;
                    this.dropdown.classList.add('facets-js-hide');
                    return;
                }
            }
            this.dropdown.innerHTML = '';
            this.dropdown.classList.remove('facets-js-hide');
            this.dropdown.style.width = rect.width.toString() + 'px';
            this.dropdown.style.overflowY = 'scroll';
            this.dropdown.style.top = (rect.bottom + 5).toString() + 'px';
            this.dropdown.style.left = rect.left.toString() + 'px';
            const listener = (e) => {
                let el = e.target;
                do {
                    if (el === this.inputBox || el === this.dropdown) {
                        return;
                    }
                    el = el.parentElement || el.parentNode;
                } while (null !== el && 1 === el.nodeType);
                this.dropdownSelected = -1;
                document.removeEventListener('click', listener);
                this.dropdown.classList.add('facets-js-hide');
            };
            let index = -1;
            let height = 0;
            document.addEventListener('click', listener, { capture: true });
            for (const choice of choices) {
                const currentIndex = ++index;
                const choiceElement = this.dropdown.appendChild(document.createElement('div'));
                choiceElement.classList.add('facets-js-combo-choice');
                choiceElement.innerText = choice.label;
                const hover = () => {
                    Array.prototype.slice.call(this.dropdown.children).forEach(e => e.classList.remove('selected'));
                    this.dropdownSelected = currentIndex;
                    choiceElement.classList.add('selected');
                };
                choiceElement.addEventListener('mouseover', hover);
                choiceElement.addEventListener('mouseenter', hover);
                choiceElement.addEventListener('mouseout', () => {
                    if (this.dropdownSelected === currentIndex) {
                        this.dropdownSelected = -1;
                    }
                    choiceElement.classList.remove('selected');
                });
                choiceElement.addEventListener('click', applyFilter.bind(this, choice));
                const rect = choiceElement.getBoundingClientRect();
                height += rect.height;
            }
            this.dropdown.style.height = height.toString() + 'px';
        }
        createFilter(show = true) {
            const filter = new Filter(this.fields, (element) => this.element.insertBefore(element, this.newFilterBtn), this.locale, show);
            this.filters.push(filter);
            this.newFilterBtn.style.display = 'none';
            filter.addEventListener('remove', () => {
                this.element.removeChild(filter.container);
                this.filters.splice(this.filters.indexOf(filter), 1);
                this.newFilterBtn.style.display = 'block';
                this._appliedFilters.delete(filter);
            }, { once: true });
            filter.addEventListener('open', () => {
                this.newFilterBtn.style.display = 'none';
            });
            filter.addEventListener('apply-filter', (e) => {
                this.newFilterBtn.style.display = 'block';
                const { filter } = e.detail;
                this._appliedFilters.add(filter);
                this.dispatchEvent(new CustomEvent('change', {
                    detail: this.appliedFilters,
                }));
            });
            return filter;
        }
    }

    const locales = {
        en: en,
        it: it,
    };

    exports.Facets = Facets;
    exports.Field = Field;
    exports.Filter = Filter;
    exports.locales = locales;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=facets-js.umd.js.map
