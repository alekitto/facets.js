export interface FilterInterface {
    readonly field: string;
    readonly operator: [string, string];
    readonly value: any;
}
