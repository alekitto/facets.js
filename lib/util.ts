export const createLink = (className: string, label: string, hidden: boolean): HTMLAnchorElement => {
    const el = document.createElement('a');
    el.classList.add(className);
    if (hidden) {
        el.style.display = 'none';
    }

    el.addEventListener('click', e => e.preventDefault());
    el.innerText = label;

    return el;
};

export const createButton = (className: string, label: string, icon?: string): HTMLButtonElement => {
    const el = document.createElement('button');
    el.type = 'button';

    el.classList.add(className);

    if (icon) {
        el.title = label;

        const iconEl = document.createElement('i');
        iconEl.classList.add('facets-ico-' + icon);
        el.appendChild(iconEl);
    } else {
        el.innerText = label;
    }

    return el;
};
