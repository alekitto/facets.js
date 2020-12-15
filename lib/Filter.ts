import { Field } from "./Field";
import { createButton } from "./util";
import { FieldType } from "./FieldType";
import EventTarget from "event-target-shim";
import { en } from "./i18n/en";

const TEXT_OPERATORS = [
    [ 'eq', 'is equal to' ],
    [ 'neq', 'is not equal to' ],
    [ 'ct', 'contains' ],
    [ 'nct', 'does not contain' ],
    [ 'sw', 'starts with' ],
    [ 'ew', 'ends with' ],
    [ 'null', 'is empty' ],
    [ 'notnull', 'is not empty' ],
];

export class Filter extends EventTarget {
    public field: Field | null = null;
    public operator?: () => [string, string];
    public other?: () => string;

    readonly container: HTMLElement;

    private readonly hide: () => void;
    private readonly show: () => void;
    private specContainer: HTMLDivElement;
    private label: HTMLSpanElement;

    constructor(fields: Field[] | Readonly<Field[]>, appendChild: (element: HTMLElement) => HTMLElement, private locale: Record<string, string> = en) {
        super();

        const container = document.createElement('div');
        container.classList.add('filter-container');
        container.style.display = 'flex';

        this.container = appendChild(container);

        const filterTypeSelect = this.container.appendChild(document.createElement('select'));
        let emptyOption: HTMLOptionElement | null = filterTypeSelect.appendChild(document.createElement('option'));

        filterTypeSelect.value = '';
        for (const field of fields) {
            const option = document.createElement('option');
            option.value = field.name;
            option.innerText = field.label;

            filterTypeSelect.appendChild(option);
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

        filterTypeSelect.addEventListener('change', e => {
            e.stopPropagation();
            if (null !== emptyOption) {
                filterTypeSelect.removeChild(emptyOption);
                emptyOption = null;
            }

            const field = fields.find(f => f.name === (e.target! as HTMLSelectElement).value)!;
            if (! field) {
                e.preventDefault();
                return;
            }

            applyFilterBtn.style.display = 'block';
            this.field = field;

            this.specContainer.innerHTML = '';
            switch (field.type) {
                case FieldType.TEXT:
                    this.createTextFilter();
                    break;
            }
        });

        filterTypeSelect.focus();

        this.hide = (): void => {
            filterTypeSelect.style.display = 'none';
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

            filterTypeSelect.style.display = 'block';
            this.specContainer.style.display = 'flex';
            applyFilterBtn.style.display = this.field ? 'block' : 'none';
            removeFilterBtn.style.display = 'block';

            this.label.style.display = 'none';
        }

        this.label.addEventListener('click', () => this.show());
        setTimeout(() => this.show(), 0);

        this.container.addEventListener('keydown', e => {
            if (e.key === "Enter" || e.which === 13 || e.keyCode === 13) {
                this.applyFilter();
                return false;
            }

            return true;
        }, { capture: true });
    }

    private createTextFilter() {
        const operatorSelect = this.specContainer.appendChild(document.createElement('select'));
        for (const op of TEXT_OPERATORS) {
            const option = document.createElement('option');
            option.value = op[0];
            option.innerText = this.locale[op[1]] ?? op[1];

            operatorSelect.appendChild(option);
        }

        const comparandInput = this.specContainer.appendChild(document.createElement('input'));
        comparandInput.type = 'text';
        comparandInput.value = '';

        operatorSelect.addEventListener('change', e => {
            const operator = (e.target as HTMLSelectElement).value;
            comparandInput.style.display = operator === 'null' || operator === 'notnull' ? 'none' : 'block';
        });

        this.operator = () => {
            const value = operatorSelect.value;
            return TEXT_OPERATORS.find(o => o[0] === value) as [string, string];
        };

        this.other = () => comparandInput.value;
    }

    private applyFilter() {
        if (! this.operator || ! this.other || ! this.field) {
            return;
        }

        const operator = this.operator();
        const other = this.other();

        this.label.innerText = (this.field.label ?? this.field.name) + ' ' + this.locale[operator[1]];
        if (operator[0] !== 'null' && operator[0]
            !== 'notnull') {
            this.label.innerText += ' "' + other + '"';
        }

        this.hide();
        this.dispatchEvent(new CustomEvent('apply-filter', {
            detail: {
                filter: this,
                value: {
                    field: this.field.name,
                    operator: operator[0],
                    other,
                },
            },
        }))
    }
}
