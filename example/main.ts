import { Facets, FieldType } from '../dist/facets-js';

const example1 = new Facets(document.getElementById('facets-example-1') as HTMLDivElement, {
    fields: [
        { name: 'name', label: 'Nome', type: FieldType.TEXT },
    ],
});

console.log(example1);
