import { FieldType } from './FieldType';

interface BaseFieldProps {
    name: string;
    label?: string;
}

export interface Choice {
    label: string;
    value: string;
}

export type Choices = Choice[] | IterableIterator<Choice>;
type ChoicesLoader = Choices | (() => IterableIterator<Choices>) | (() => Promise<IterableIterator<Choices>>);

export type FieldProps = BaseFieldProps & ({
    type: Exclude<FieldType, FieldType.CHOICE | FieldType.CUSTOM>;
} | {
    type: FieldType.CHOICE;
    choices: null | ChoicesLoader;
} | {
    type: FieldType.CUSTOM,
    value: any,
});

export class Field {
    readonly name: string;
    readonly label: string;
    readonly type: FieldType;
    readonly choices: null | ChoicesLoader;
    readonly value: undefined | any;

    constructor(props: FieldProps) {
        this.name = props.name;
        this.label = props.label ?? props.name;
        this.type = props.type;
        this.choices = props.type === FieldType.CHOICE ? props.choices : null;
        this.value = props.type === FieldType.CUSTOM ? props.value : undefined;
    }
}
