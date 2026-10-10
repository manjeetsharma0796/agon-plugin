"use strict";
// An invisible press area laid over a card's body. A click, or Enter or space while it holds the
// focus, opens the card; `m` asks for the card's menu. Not right-click: the desktop app opens its
// own Copy menu on a right-click and a plugin cannot stop it (checked 2026-10-10). A hold to open the
// menu made every click wait for the release, so the click fires on press again.
Object.defineProperty(exports, "__esModule", { value: true });
var Press = function (_p, s) {
    var Box = s.elements.Box;
    s.onPointer(function (ev) {
        if (ev.type === 'down' && ev.button === 'left')
            s.post({ press: true });
    });
    s.onKey(function (k) {
        if (k.key === 'return' || k.key === ' ')
            s.post({ press: true });
        else if (k.key === 'm')
            s.post({ menu: true });
    });
    return Box({ width: '100%', height: '100%' });
};
exports.default = Press;
