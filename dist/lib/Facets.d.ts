import '../styles/factes-js.scss';
import { Field, FieldProps } from './Field';
import EventTarget from 'event-target-shim';
import { FilterInterface } from './filter/FilterInterface';
import { Localization } from './i18n/localization';
declare type DropdownElement = {
    label: string;
    filter: FilterInterface;
};
interface FacetsOptions {
    classPrefix: string;
    fields: FieldProps[];
    locale: Localization;
    dropdownLoader: (value: string, instance: Facets) => Generator<DropdownElement> | IterableIterator<DropdownElement> | DropdownElement[];
}
export declare class Facets extends EventTarget {
    private element;
    readonly fields: Readonly<Field[]>;
    readonly locale: Localization;
    private readonly options;
    private readonly inputBox;
    private readonly newFilterBtn;
    private readonly filters;
    private readonly _appliedFilters;
    private readonly dropdown;
    private dropdownSelected;
    constructor(element: HTMLDivElement, options?: Partial<FacetsOptions>);
    get appliedFilters(): FilterInterface[];
    private onInput;
    private createFilter;
}
export {};
