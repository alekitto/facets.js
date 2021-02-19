import { FieldType } from './FieldType';
interface BaseFieldProps {
    name: string;
    label?: string;
}
export interface Choice {
    label: string;
    value: string;
}
export declare type Choices = Choice[] | IterableIterator<Choice>;
declare type ChoicesLoader = Choices | (() => IterableIterator<Choices>) | (() => Promise<IterableIterator<Choices>>);
export declare type FieldProps = BaseFieldProps & ({
    type: Exclude<FieldType, FieldType.CHOICE | FieldType.CUSTOM>;
} | {
    type: FieldType.CHOICE;
    choices: null | ChoicesLoader;
} | {
    type: FieldType.CUSTOM;
    value: any;
});
export declare class Field {
    readonly name: string;
    readonly label: string;
    readonly type: FieldType;
    readonly choices: null | ChoicesLoader;
    readonly value: undefined | any;
    constructor(props: FieldProps);
}
export {};
