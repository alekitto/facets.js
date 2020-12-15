import '../styles/factes-js.scss';
import { FieldType } from "./FieldType";
import { createButton } from "./util";
import { Field } from "./Field";
import { Filter } from "./Filter";

interface FacetsOptions {
    'class-prefix': string;
    fields: {
        name: string;
        label?: string;
        type: FieldType;
    }[];
}

const DEFAULT_OPTIONS: Omit<FacetsOptions, 'fields'> = {
    'class-prefix': '',
};

export class Facets {
    private readonly options: FacetsOptions;
    private readonly inputBox: HTMLInputElement;
    private readonly newFilterBtn: HTMLButtonElement;
    private readonly fields: Readonly<Field[]> = [];
    private readonly filters: Filter[] = [];

    constructor(private element: HTMLDivElement, options: Partial<FacetsOptions> = {}) {
        if (element.tagName !== 'DIV') {
            throw new TypeError('Facets.js only supports div tags');
        }

        if (! options.fields || ! Array.isArray(options.fields) || options.fields.length === 0) {
            throw new Error('At least one field is required');
        }

        this.options = Object.assign({}, options, DEFAULT_OPTIONS) as FacetsOptions;
        if (this.options['class-prefix']) {
            this.options["class-prefix"] += '-';
        }

        this.fields = Object.freeze(options.fields.map(f => {
            const obj = new Field(f.name, f.type);
            obj.label = f.label ?? f.name;

            return obj;
        }));

        this.element.innerHTML = '';
        this.element.classList.add(this.options["class-prefix"] + 'facets-js-wrapper');
        this.element.style.display = 'flex';
        this.element.style.flexWrap = '1';
        this.element.style.minHeight = '1.5rem';
        this.element.style.width = '320px';

        // @todo: add default filters

        const newFilterBtn = createButton('new-filter-btn', 'Add filter', 'plus');
        this.newFilterBtn = this.element.appendChild(newFilterBtn);
        this.newFilterBtn.addEventListener('click', () => this.createFilter());

        const inputBox = document.createElement('input');
        inputBox.type = 'text';
        inputBox.style.minWidth = '160px';
        inputBox.style.flexGrow = '1';
        inputBox.style.border = '0';
        this.inputBox = this.element.appendChild(inputBox);
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
        }, { once: true });

        filter.addEventListener('open', () => {
            this.newFilterBtn.style.display = 'none';
        });

        filter.addEventListener('apply-filter', (e: Event) => {
            this.newFilterBtn.style.display = 'block';
            console.log(JSON.stringify((e as CustomEvent).detail));
        });
    }
}
