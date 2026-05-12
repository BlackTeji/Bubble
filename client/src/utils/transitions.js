export const navigateTo = (url) => {
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            window.location.assign(url);
        });
    } else {
        window.location.assign(url);
    }
};

export const transitionContent = async (container, renderFn) => {
    if (!document.startViewTransition) {
        container.innerHTML = '';
        renderFn(container);
        return;
    }

    await document.startViewTransition(() => {
        container.innerHTML = '';
        renderFn(container);
    }).ready;
};