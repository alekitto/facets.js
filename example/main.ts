import { Facets, FieldType } from '../dist/facets-js';

const example1 = new Facets(document.getElementById('facets-example-1') as HTMLDivElement, {
    fields: [
        { name: 'name', label: 'Nome', type: FieldType.TEXT },
        { name: 'age', label: 'Età', type: FieldType.NUMBER },
        { name: 'Foo', label: 'foo', type: FieldType.BOOLEAN },
        { name: 'sep1', type: FieldType.SEPARATOR },
        { name: 'date', label: 'Data', type: FieldType.DATE },
        { name: 'time', label: 'Ora', type: FieldType.TIME },
        { name: 'select', label: 'Scelta', type: FieldType.CHOICE, choices: [
            { label: 'Good!', value: 'good' },
            { label: 'Bad!', value: 'bad' },
        ] },
        { name: 'custom', label: 'My filter', type: FieldType.CUSTOM, value: [
            {
                field: 'name',
                operator: [ 'eq', 'is equal to' ],
                value: 'Foobar',
            },
        ]},
    ],
});

console.log(example1);
