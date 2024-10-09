import { showTooltip, EditorView } from "@codemirror/view";
import { StateField } from "@codemirror/state";

export function tooltipField(users) {
    return StateField.define({
        create: (state) => getCursorTooltips(state, users),
        update(tooltips, tr) {
            if (!tr.docChanged && !tr.selection) return tooltips;
            return getCursorTooltips(tr.state, users);
        },
        provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
    });
}

export function getCursorTooltips(state, users) {
    return users.reduce((tooltips, user) => {
        if (!user.typing) {
            return tooltips; // Skip users not typing
        }

        let text = `👤 ${user.username} is typing...`;
        const pos = user.cursorPosition; // This should be set when a user starts typing

        if (pos !== undefined) { // Check if cursor position is defined
            tooltips.push({
                pos,
                above: true,
                strictSide: true,
                arrow: true,
                create: () => {
                    let dom = document.createElement("div");
                    dom.className = "cm-tooltip-cursor";
                    dom.textContent = text;
                    return { dom };
                },
            });
        }

        return tooltips;
    }, []);
}

export const cursorTooltipBaseTheme = EditorView.baseTheme({
    ".cm-tooltip.cm-tooltip-cursor": {
        backgroundColor: "#8d8e8f",
        color: "white",
        border: "none",
        padding: "2px 7px",
        opacity: "0.6",
        borderRadius: "7px",
        zIndex: "10",
        "& .cm-tooltip-arrow:before": {
            borderTopColor: "#8d8e8f",
        },
        "& .cm-tooltip-arrow:after": {
            borderTopColor: "transparent",
        },
    },
});
