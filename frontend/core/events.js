/**
 * DCA Enterprise: Global Event Bus
 */
export const events = {
    emit(name, data) {
        window.dispatchEvent(new CustomEvent(name, { detail: data }));
    },
    on(name, callback) {
        window.addEventListener(name, (e) => callback(e.detail));
    }
};
