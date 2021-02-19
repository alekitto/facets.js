import { Choice, Choices, Field } from '../Field';
import EventTarget from 'event-target-shim';
import { FieldType } from '../FieldType';
import { FilterInterface } from './FilterInterface';
import { Localization } from '../i18n/localization';
import { createButton } from '../util';
import { en } from '../i18n/en';

const TEXT_OPERATORS: [string, keyof Localization][] = [
    [ 'eq', 'is equal to' ],
    [ 'neq', 'is not equal to' ],
    [ 'ct', 'contains' ],
    [ 'nct', 'does not contain' ],
    [ 'sw', 'starts with' ],
    [ 'ew', 'ends with' ],
    [ 'null', 'is empty' ],
    [ 'notnull', 'is not empty' ],
];

const NUMBER_OPERATORS: [string, keyof Localization][] = [
    [ 'eq', 'is equal to' ],
    [ 'neq', 'is not equal to' ],
    [ 'gt', 'greater than' ],
    [ 'gte', 'greater than or equal' ],
    [ 'lt', 'less than' ],
    [ 'lte', 'less than or equal' ],
    [ 'null', 'is empty' ],
    [ 'notnull', 'is not empty' ],
];

const isBlink: boolean = (() => {
    const ua = navigator.userAgent;

    return /(?:AppleWebKit|Chrome)/.test(ua);
})();

export class Filter extends EventTarget implements FilterInterface {
    public other?: () => string;
    readonly container: HTMLElement;

    private readonly hide: () => void;
    private readonly show: () => void;
    private _field: Field | null = null;
    private _operator?: () => [string, string];
    private specContainer: HTMLDivElement;
    private label: HTMLSpanElement;

    private fieldSelect: HTMLSelectElement;
    private operatorSelect: null | HTMLSelectElement = null;
    private otherInput: null | HTMLInputElement | HTMLSelectElement = null;

    constructor(private fields: Field[] | Readonly<Field[]>, appendChild: (element: HTMLElement) => HTMLElement, private locale: Localization = en, show = true) {
        super();

        const container = document.createElement('div');
        container.classList.add('filter-container');
        container.style.display = 'flex';

        this.container = appendChild(container);

        const fieldSelect = this.fieldSelect = this.container.appendChild(document.createElement('select'));
        let emptyOption: HTMLOptionElement | null = fieldSelect.appendChild(document.createElement('option'));

        fieldSelect.value = '';
        for (const field of fields) {
            if (field.type === FieldType.SEPARATOR) {
                let element;
                if (isBlink) {
                    element = document.createElement('hr');
                } else {
                    element = document.createElement('option');
                    element.disabled = true;
                    element.value = '--------------------';
                }

                fieldSelect.appendChild(element);
            } else {
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

            const field = fields.find(f => f.name === (e.target as HTMLSelectElement).value)!;
            if (! field) {
                e.preventDefault();
                return;
            }

            applyFilterBtn.style.display = 'block';
            this._field = field;
            this._initFilter();
        });

        fieldSelect.focus();

        this.hide = (): void => {
            fieldSelect.style.display = 'none';
            this.specContainer.style.display = 'none';
            applyFilterBtn.style.display = 'none';
            removeFilterBtn.style.display = 'none';

            this.label.style.display = 'inline-block';
        };

        this.show = (): void => {
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
        }

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

    set field(field: string) {
        const fieldObject = this.fields.find(f => f.name === field);
        if (! fieldObject) {
            return;
        }

        this._field = fieldObject;
        this.fieldSelect.value = fieldObject.name;
        this._initFilter();
    }

    get operator(): [string, string] {
        return this._operator ? this._operator() : [ 'eq', this.locale['is equal to'] ];
    }

    set operator(op: [string, string]) {
        if (this.operatorSelect) {
            this.operatorSelect.value = op[0];
        }

        this._operator = () => op;
    }

    get value(): any {
        return this.other ? this.other() : null;
    }

    set value(value: any) {
        if (this.otherInput) {
            this.otherInput.value = value;
        }

        this.other = () => value;
    }

    private createTextFilter() {
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
            const operator = (e.target as HTMLSelectElement).value;
            comparandInput.style.display = 'null' === operator || 'notnull' === operator ? 'none' : 'block';
        });

        this._operator = () => {
            const value = operatorSelect.value;
            return TEXT_OPERATORS.find(o => o[0] === value) as [string, keyof Localization];
        };

        this.other = () => comparandInput.value;
    }

    private createNumberFilter(type: FieldType.NUMBER | FieldType.DATE | FieldType.TIME) {
        const operatorSelect = this.operatorSelect = this.specContainer.appendChild(document.createElement('select'));
        for (const op of NUMBER_OPERATORS) {
            const option = document.createElement('option');
            option.value = op[0];
            option.innerText = this.locale[op[1]] ?? op[1];

            operatorSelect.appendChild(option);
        }

        const comparandInput = this.otherInput = this.specContainer.appendChild(document.createElement('input'));
        comparandInput.value = '';
        if (FieldType.NUMBER === type) {
            comparandInput.type = 'number';
        } else if (FieldType.DATE === type) {
            comparandInput.type = 'date';
        } else {
            comparandInput.type = 'time';
        }

        operatorSelect.addEventListener('change', e => {
            const operator = (e.target as HTMLSelectElement).value;
            comparandInput.style.display = 'null' === operator || 'notnull' === operator ? 'none' : 'block';
        });

        this._operator = () => {
            const value = operatorSelect.value;
            return NUMBER_OPERATORS.find(o => o[0] === value) as [string, keyof Localization];
        };

        this.other = () => comparandInput.value;
    }

    private createBooleanFilter() {
        const comparandSelect = this.otherInput = this.specContainer.appendChild(document.createElement('select'));
        const values: [string, keyof Localization][] = [
            [ '1', 'Yes' ],
            [ '0', 'No' ],
        ];

        for (const op of values) {
            const option = document.createElement('option');
            option.value = op[0];
            option.innerText = this.locale[op[1]] ?? op[1];

            comparandSelect.appendChild(option);
        }

        this._operator = () => [ 'eq', 'is equal to' ];
        this.other = () => comparandSelect.value;
    }

    private createChoiceFilter() {
        const comparandSelect = this.otherInput = this.specContainer.appendChild(document.createElement('select'));
        let choices: unknown = this._field?.choices ?? [];

        const loadChoices = (choices: Choice[] | IterableIterator<Choice>) => {
            comparandSelect.innerHTML = '';

            for (const choice of choices) {
                const option = document.createElement('option');
                option.value = choice.value
                option.innerText = choice.label;

                comparandSelect.appendChild(option);
            }
        };

        if ('function' === typeof choices) {
            choices = choices() as (Choices | Promise<Choices>);
        }

        if ('then' in (choices as Choices | Promise<Choices>)) {
            const loadingOption = document.createElement('option');
            loadingOption.value = '';
            loadingOption.innerText = this.locale['loading'];
            comparandSelect.appendChild(loadingOption);

            (choices as Promise<IterableIterator<Choice>>).then(loadChoices, () => {
                loadingOption.innerText = this.locale['error while loading options'];
            });
        } else {
            loadChoices(choices as Choices);
        }

        this._operator = () => [ 'eq', 'is equal to' ];
        this.other = () => comparandSelect.value;
    }

    private _initFilter() {
        const field = this._field;
        if (! field) {
            return;
        }

        this.specContainer.innerHTML = '';
        this.operatorSelect = null;
        this.otherInput = null;
        switch (field.type) {
            case FieldType.TEXT:
                this.createTextFilter();
                break;

            case FieldType.NUMBER:
            case FieldType.DATE:
            case FieldType.TIME:
                this.createNumberFilter(field.type);
                break;

            case FieldType.BOOLEAN:
                this.createBooleanFilter();
                break;

            case FieldType.CHOICE:
                this.createChoiceFilter();
                break;

            case FieldType.CUSTOM:
                this._operator = () => [ '', '' ];
                this.other = () => field.value;
                break;
        }
    }

    /**
     * @internal
     */
    applyFilter() {
        if (! this._operator || ! this.other || ! this._field) {
            return;
        }

        const operator = this._operator();
        const other = this.other();

        this.label.innerText = (this._field.label ?? this._field.name);
        if (operator[0]) {
            this.label.innerText += ' ' + this.locale[operator[1] as keyof Localization];
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
        }))
    }
}
