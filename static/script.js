class Item extends HTMLElement {
    /**
     * Custom HTMLElement for maintenance items.
     * 
     * Syntax:
     *     <x-item id="ITEM_ID" title="ITEM_NAME" **attributes> NOTE_CONTENT </x-item>
     * 
     * Attributes:
     * - id <Number>
     * - title <String>
     * - categoryID <Number>
     * - visible <bool>
     * - cost <Optional[Number]> [DEFAULT: 0.00]
     * - status <Optional[String]> [DEFAULT: "0"]
     * - statdesc <Optional[String]> [DEFAULT: ""]
     */
    constructor() {
        super();

        // required attributes
        if (
            !this.hasAttribute("title") ||
            !this.hasAttribute("id") ||
            !this.hasAttribute("categoryID")
        ) return;

        this.attachShadow({ mode: "open" });

        // attributes
        this.changed = false;
        this.id = this.getAttribute("id");
        this.categoryID = this.getAttribute("categoryID");
        this.category = document.getElementById("cat-" + this.categoryID);
        this.note = this.innerHTML || "";

        this.repairCost = this.getAttribute("cost") || "0.00";

        this.statusDescription = this.getAttribute("statdesc") || "OK";
        this.status = this.getAttribute("status") || "0";
        this.visible = this.getAttribute("visible") || "false";

        // constants
        this.LAST_NOTE = this.innerHTML;
        this.LAST_REPAIR_COST = this.repairCost;
        this.LAST_STATUS = this.status;
        this.LAST_STATUS_DESCRIPTION = this.statusDescription;

        // styles
        const wrapperStyle = {
            "display": "flex",
            "align-items": "center",
            "gap": "1rem",
            "margin": "0 auto",
            "padding": ".5rem 0",
            "width": "100%",
            "background-color": "var(--background)",
        };

        const titleStyle = {
            "width": "25ch",
            "text-align": "right",
        }

        const statusDotStyle = {
            "display": "block",
            "width": "0",
            "height": "0",
            "padding": "calc(var(--status-dot-diameter)/2)",
            "border-radius": "50%",
            "cursor": "pointer",
        };

        const statusDetailsStyle = {
            "display": "flex",
            "flex-wrap": "wrap",
            "justify-content": "right",
            "gap": ".25rem",
            "width": "300px",
            "min-width": "300px",
            "height": "50px",
        };

        const statusSelectStyle = {
            "display": "block",
            "width": "100%",
        };

        const lblRepairCostStyle = {
            "display": "inline",
            "margin": "0",
            "margin-right": "1rem",
        };

        const noteStyle = {
            "min-height": "3rem",
            "min-width": "280px",
            "max-width": "79ch",
        }

        const linkStyle = {
            "cursor": "pointer",
        }

        const wrapper = document.createElement("span");
        Object.assign(wrapper.style, wrapperStyle);

        // item title
        const title = wrapper.appendChild(document.createElement("p"));
        title.textContent = this.hasAttribute("title") ? this.getAttribute("title") : "";
        Object.assign(title.style, titleStyle);

        // item status indicator dot
        const statusDot = wrapper.appendChild(document.createElement("span"));
        statusDot.onclick = (o) => this.nextStatusDotColor(o);
        Object.assign(statusDot.style, statusDotStyle);
        this.setStatusDotColor(statusDot);

        // item status details (description selector, cost input)
        const statusDetails = wrapper.appendChild(document.createElement("span"));
        Object.assign(statusDetails.style, statusDetailsStyle);

        const statusSelect = statusDetails.appendChild(document.createElement("select"));

        // add options
        this.setStatusDescription(statusSelect, this.statusDescription);

        if (this.statusDescription != "OK") {
            // if current status is not `OK`, add `OK` as an option to the selector
            let optionOk = statusSelect.appendChild(document.createElement("option"));
            optionOk.value = "OK";
            optionOk.innerHTML = "OK";
        }

        if (this.hasAttribute("options")) {
            // selector options are passed to the item as a string
            // options are separated by semicolons
            let option_list = this.getAttribute("options").split(";");
            for (let option of option_list) {
                let o = statusSelect.appendChild(document.createElement("option"));
                o.value = option;
                o.innerHTML = option;
            }
        }

        // TODO: other is an option that requires the `note` field to be filled out
        let optionOther = statusSelect.appendChild(document.createElement("option"));
        optionOther.value = "Other";
        optionOther.innerHTML = "Other";

        statusSelect.onchange = (o) => this.setStatusDescription(statusSelect, o.target.value, false);
        Object.assign(statusSelect.style, statusSelectStyle);

        // label that displays text "Repair Cost:"
        const lblRepairCost = statusDetails.appendChild(
            document.createElement("p")
        );
        lblRepairCost.innerHTML = "Repair Cost:";
        Object.assign(lblRepairCost.style, lblRepairCostStyle);

        // input for this.repairCost
        const repairCostInput = statusDetails.appendChild(
            document.createElement("input")
        );
        repairCostInput.value = this.repairCost;
        repairCostInput.oninput = () => this.setRepairCost(repairCostInput);

        // maintenance notes
        const note = wrapper.appendChild(document.createElement("textarea"));
        note.textContent = this.innerHTML.trim();
        note.oninput = () => this.setNoteContent(note);
        Object.assign(note.style, noteStyle);

        // history link
        const history = wrapper.appendChild(document.createElement("a"));
        history.innerHTML = "History";
        history.onclick = () => getHistory(this.id);
        Object.assign(history.style, linkStyle);

        // history button event
        history.onclick = () => displayHistoryPanel(this);

        // hide link
        if (this.visible == "true") {
            const hide = wrapper.appendChild(document.createElement("a"));
            hide.innerHTML = "Hide";
            hide.onclick = () => this.setVisible(false);
            Object.assign(hide.style, linkStyle);
        }

        else {
            const unhide = wrapper.appendChild(document.createElement("a"));
            unhide.innerHTML = "Unhide";
            unhide.onclick = () => this.setVisible(true);
            Object.assign(unhide.style, linkStyle);
        }


        this.shadowRoot.append(wrapper);

        // append to category if item is visible
        if (this.visible == "true") {
            this.category.appendChild(this);
        }
        else {
            hiddenItems.appendChild(this);
        }
    }

    nextStatusDotColor(event) {
        // cycle through status number (0-2) and set color accordingly
        // see `setStatusDotColor()` for color-change logic
        let intStatus = parseInt(this.status);
        let statusDot = event.target;

        intStatus++;
        intStatus %= 3;

        this.status = `${intStatus}`;
        this.changed = true;
        this.setStatusDotColor(statusDot);
    }

    setNoteContent(textareaElement) {
        this.noteContent = textareaElement.value;
        this.changed = true;
    }

    setRepairCost(inputElement) {
        this.repairCost = inputElement.value;
        this.changed = true;
    }

    setStatusDescription(selectElement, value, auto = true) {
        // set this.statusDescription to `value`
        // called automatically when this.statusDescription is empty

        // check whether `value` currently exists within the selector
        let optionExists = false
        for (const option of selectElement.options) {
            if (option.value == value) optionExists = true;
        }

        // if `value` does not exist, append it to the selector
        if (!optionExists) {
            let option = selectElement.appendChild(document.createElement("option"));
            option.value = value;
            option.innerHTML = value;
        }

        selectElement.value = value;
        this.statusDescription = selectElement.value;

        // if this change was done by the user, set this.changed to true
        if (!auto) this.changed = true;
    }

    setStatusDotColor(statusDot) {
        // cycle between green, yellow, and red status indicator colors
        let color = "";
        switch (this.status) {
            case "1":
                color = "var(--yellow)";
                break;

            case "2":
                color = "var(--red)";
                break;

            default:
                color = "var(--green)";
                break;
        }

        statusDot.style.backgroundColor = color;
        return color;
    }

    setVisible(value) {
        this.visible = `${value}`;
        this.changed = true;

        if (!value) {
            this.category.removeChild(this);
            hiddenItems.appendChild(this);
        }
        else {
            hiddenItems.removeChild(this);
            this.category.appendChild(this);
        }
    }

}

function collect_changes() {
    // get all changed items and return them in Object form
    let changed_items = [];
    items.forEach((item) => {
        if (item.changed) changed_items.push({
            "id": parseInt(item.id),
            "title": item.title,
            "category_id": parseInt(item.categoryID),
            "details": {
                "status": parseInt(item.status),
                "statdesc": item.statusDescription,
                "cost": parseInt(item.repairCost.replace(".", "")),
                "note": item.noteContent,
                "visible": item.visible == "true" ? true : false,
            },
        });
    });

    return changed_items;
}

function displayHistoryPanel(item) {
    if (!historyPanel.classList.contains("active")) {
        const xhr = new XMLHttpRequest();

        xhr.onload = () => {
            historyBody.innerHTML = xhr.response;
            historyHeader.innerHTML = item.title;
            console.log("GET history for Item #" + item.id);
        }

        xhr.open("GET", "history/" + item.id, true);
        xhr.send();

    } else {
        historyBody.innerHTML = "";
        historyHeader.innerHTML = "";
    }

    historyPanel.classList.add("active");
}

function exitHistoryPanel() {
    historyPanel.classList.remove("active");
}

function post_changes(items) {
    // send JSON data to backend via POST request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    // log response to the console
    xhr.onload = () => console.log(xhr.response);

    xhr.send(JSON.stringify(items));
}

function save_changes() {
    // get changes as an array of Objects
    let changed_items = collect_changes();
    console.log(changed_items);

    // send data to backend via POST request
    post_changes(changed_items);
}

function scrollToCategory(categoryID) {
    // scroll to the requested category
    document.getElementById("cat-" + categoryID).scrollIntoView();
    document.getElementById("toc").toggleAttribute("open");
}

function scrollToTop() {
    // scroll to the top of the page
    window.scrollTo(0, 0);
}

const hiddenItems = document.getElementById("hidden-items");
const historyPanel = document.getElementById("history-panel");
const historyBody = document.getElementById("history-body");
const historyHeader = document.getElementById("history-header");

// define custom x-item HTMLElement
const items = Array.from(document.getElementsByTagName("x-item"));
window.customElements.define("x-item", Item);

document.getElementById("save-changes").onclick = save_changes;