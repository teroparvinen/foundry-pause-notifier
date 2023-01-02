
export let pnSocket = undefined;

Hooks.on("init", () => {
    libWrapper.register("pause-notifier", "PlaceablesLayer.prototype.moveMany", onMoveMany, "MIXED");

    game.settings.register("pause-notifier", "suppress-warning", {
        name: "pause-notifier.setting-suppress-warning",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register("pause-notifier", "show-floater", {
        name: "pause-notifier.setting-show-floater",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
    game.settings.register("pause-notifier", "pulse-pause", {
        name: "pause-notifier.setting-pulse-pause",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });
});

Hooks.on("setup", () => {
    pnSocket = socketlib.registerModule("pause-notifier");
    pnSocket.register("notify", notify);
});

function onMoveMany(wrapped, options) {
    if ( !options.dx && !options.dy ) return [];
    if ( game.paused && !game.user.isGM ) {
        triggerNotification();
        if (game.settings.get("pause-notifier", "suppress-warning")) {
            return;
        }
    }
    return wrapped(options);
}

function triggerNotification() {
    pnSocket.executeForEveryone("notify", canvas.tokens.controlled.map(t => t.document.uuid));
}

function notify(tokenUuids) {
    if (game.settings.get("pause-notifier", "show-floater")) {
        const tokens = tokenUuids.map(u => fromUuidSync(u).object);
        for (const token of tokens) {
            createScrollingText(token, game.i18n.localize("pause-notifier.floater"));
        }
    }

    if (game.user.isGM && game.settings.get("pause-notifier", "pulse-pause")) {
        const el = $('#pause')[0];
        el.classList.remove("pulse");
        void el.offsetWidth;
        el.classList.add("pulse");
    }
}

function createScrollingText(token, text, floatUp = true) {
    if (token && !token?.document.hidden) {
        canvas.interface.createScrollingText(token.center, text, {
            anchor: CONST.TEXT_ANCHOR_POINTS.CENTER,
            direction: floatUp ? CONST.TEXT_ANCHOR_POINTS.TOP : CONST.TEXT_ANCHOR_POINTS.BOTTOM,
            distance: (2 * token.h),
            fontSize: 28,
            stroke: 0x000000,
            strokeThickness: 4,
            jitter: 0.25
        });
    }
}
