export const navigateTo = (url) => {
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            window.location.href = url;
        });
    } else {
        window.location.href = url;
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