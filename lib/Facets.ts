import '../styles/factes-js.scss';
import { Field, FieldProps } from './Field';
import EventTarget from 'event-target-shim';
import { FieldType } from './FieldType';
import { Filter } from './filter/Filter';
import { FilterInterface } from './filter/FilterInterface';
import { Localization } from './i18n/localization';
import { createButton } from './util';
import { en } from './i18n/en';

type DropdownElement = { label: string, filter: FilterInterface };
interface FacetsOptions {
    classPrefix: string;
    fields: FieldProps[];
    locale: Localization;
    dropdownLoader: (value: string, instance: Facets) => Generator<DropdownElement> | IterableIterator<DropdownElement> | DropdownElement[];
}

const DEFAULT_OPTIONS: Omit<FacetsOptions, 'fields'> = {
    classPrefix: '',
    locale: en,
    dropdownLoader: function * (value, instance): Generator<DropdownElement> {
        const textFields = instance.fields.filter(f => f.type === FieldType.TEXT);
        for (const field of textFields) {
            yield {
                label: field.label + ' ' + instance.locale['contains'] + ' "' + value + '"',
                filter: {
                    field: field.name,
                    operator: [ 'contains', instance.locale['contains'] ],
                    value,
                },
            };
        }
    },
};

export class Facets extends EventTarget {
    readonly fields: Readonly<Field[]> = [];
    readonly locale: Localization;

    private readonly options: FacetsOptions;
    private readonly inputBox: HTMLInputElement;
    private readonly newFilterBtn: HTMLButtonElement;
    private readonly filters: Filter[] = [];
    private readonly _appliedFilters = new Set<FilterInterface>();
    private readonly dropdown: HTMLDivElement;

    constructor(private element: HTMLDivElement, options: Partial<FacetsOptions> = {}) {
        super();
        if ('DIV' !== element.tagName) {
            throw new TypeError('Facets.js only supports div tags');
        }

        if (! options.fields || ! Array.isArray(options.fields) || 0 === options.fields.length) {
            throw new Error('At least one field is required');
        }

        this.options = Object.assign({}, options, DEFAULT_OPTIONS) as FacetsOptions;
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
        this.inputBox.addEventListener('click', this.onInput.bind(this));

        this.dropdown = this.element.appendChild(document.createElement('div'));
        this.dropdown.classList.add('facets-js-dropdown', 'facets-js-hide');
    }

    get appliedFilters() {
        return [ ...this._appliedFilters.values() ];
    }

    private onInput(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        if (! value) {
            this.dropdown.classList.add('facets-js-hide');
            return;
        }

        const rect = this.inputBox.getBoundingClientRect();

        const choices = this.options.dropdownLoader(value, this);
        this.dropdown.classList.remove('facets-js-hide');
        this.dropdown.style.width = (rect.width).toString() + 'px';
        this.dropdown.style.height = '5rem';
        this.dropdown.style.top = (rect.bottom + 5).toString() + 'px';
        this.dropdown.style.left = rect.left.toString() + 'px';

        const listener = (e: MouseEvent) => {
            let el: null | HTMLElement | (Node & ParentNode) = e.target as HTMLElement;
            do {
                if (el === this.inputBox || el === this.dropdown) {
                    return;
                }

                el = el.parentElement || el.parentNode;
            } while(null !== el && 1 === el.nodeType)

            document.removeEventListener('click', listener);
            this.dropdown.classList.add('facets-js-hide');
        };

        document.addEventListener('click', listener, { capture: true });

        for (const choice of choices) {
            console.log(choice);
        }
    }

    private createFilter() {
        const filter = new Filter(this.fields, (element: HTMLElement) =>
            this.element.insertBefore(element, this.newFilterBtn)
        );

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

        filter.addEventListener('apply-filter', (e: Event) => {
            this.newFilterBtn.style.display = 'block';
            const { filter } = (e as CustomEvent).detail;
            this._appliedFilters.add(filter);

            this.dispatchEvent(new CustomEvent('change', {
                detail: this.appliedFilters,
            }));
        });
    }
}
