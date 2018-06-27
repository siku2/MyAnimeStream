function adRemove() {
    Array.from(document.getElementsByTagName("*"))
        .filter((el) => {
            if (!el.firstChild) {
                return;
            }
            let nodeVal = el.firstChild.nodeValue;
            if (!nodeVal) {
                return;
            }
            return Boolean(adSearch.find(target => nodeVal.includes(target)));
        })
        .forEach(el => {
            for (let i = 0; i < 5; i++) {
                el = el.parentElement;
            }
            console.log("removed ad", el);
            el.remove();
        });
}

function observe() {
    const observer = new MutationObserver(adRemove);
    observer.observe(document.body, {
        childList: true
    });
    console.log("observing body!");
    adRemove();
}
