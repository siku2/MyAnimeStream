jQuery.fn.random = function () {
    const randomIndex = Math.floor(Math.random() * this.length);
    return jQuery(this[randomIndex]);
};