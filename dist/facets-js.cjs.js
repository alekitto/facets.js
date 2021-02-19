'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var EventTarget = require('event-target-shim');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var EventTarget__default = /*#__PURE__*/_interopDefaultLegacy(EventTarget);

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
    FieldType["CUSTOM"] = "custom";
    FieldType["SEPARATOR"] = "separator";
})(exports.FieldType || (exports.FieldType = {}));

class Field {
    constructor(props) {
        this.name = props.name;
        this.label = props.label ?? props.name;
        this.type = props.type;
        this.choices = props.type === exports.FieldType.CHOICE ? props.choices : null;
        this.value = props.type === exports.FieldType.CUSTOM ? props.value : undefined;
    }
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
const isBlink = (() => {
    const ua = navigator.userAgent;
    return /(?:AppleWebKit|Chrome)/.test(ua);
})();
class Filter extends EventTarget__default['default'] {
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
            if (field.type === exports.FieldType.SEPARATOR) {
                let element;
                if (isBlink) {
                    element = document.createElement('hr');
                }
                else {
                    element = document.createElement('option');
                    element.disabled = true;
                    element.value = '--------------------';
                }
                fieldSelect.appendChild(element);
            }
            else {
                const option = document.createElement('option');
                option.value = field.name;
                option.innerText = field.label;
                fieldSelect.appendChild(option);
            }
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
            case exports.FieldType.CUSTOM:
                this._operator = () => ['', ''];
                this.other = () => field.value;
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
        this.label.innerText = (this._field.label ?? this._field.name);
        if (operator[0]) {
            this.label.innerText += ' ' + this.locale[operator[1]];
            if ('null' !== operator[0] && 'notnull' !== operator[0]) {
                this.label.innerText += ' "' + other + '"';
            }
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
class Facets extends EventTarget__default['default'] {
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
                else if ('' !== this.inputBox.value) {
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
//# sourceMappingURL=facets-js.cjs.js.map
