import { FieldType } from "./FieldType";

export class Field {
    label: string;
    constructor(readonly name: string, readonly type: FieldType) {
        this.label = name;
    }
}
