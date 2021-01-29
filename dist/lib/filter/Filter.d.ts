import { Field } from '../Field';
import EventTarget from 'event-target-shim';
import { FilterInterface } from './FilterInterface';
import { Localization } from '../i18n/localization';
export declare class Filter extends EventTarget implements FilterInterface {
    private fields;
    private locale;
    other?: () => string;
    readonly container: HTMLElement;
    private readonly hide;
    private readonly show;
    private _field;
    private _operator?;
    private specContainer;
    private label;
    private fieldSelect;
    private operatorSelect;
    private otherInput;
    constructor(fields: Field[] | Readonly<Field[]>, appendChild: (element: HTMLElement) => HTMLElement, locale?: Localization, show?: boolean);
    get field(): string;
    set field(field: string);
    get operator(): [string, string];
    set operator(op: [string, string]);
    get value(): any;
    set value(value: any);
    private createTextFilter;
    private createNumberFilter;
    private createBooleanFilter;
    private createChoiceFilter;
    private _initFilter;
    /**
     * @internal
     */
    applyFilter(): void;
}
