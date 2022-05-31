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
     * - cost <Optional[Number]> [DEFAULT: 0]
     * - status <Optional[String]> [DEFAULT: "0"]
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

        this.repairCost = this.getAttribute("cost") || "0";

        this.status = this.getAttribute("status") || "0";
        this.visible = this.getAttribute("visible") || "false";

        // constants
        this.LAST_NOTE = this.innerHTML;
        this.LAST_REPAIR_COST = this.repairCost;
        this.LAST_STATUS = this.status;

        // styles
        const wrapperStyle = {
            "display": "flex",
            "flex-wrap": "wrap",
            "align-items": "center",
            "justify-content": "center",
            "gap": ".5rem 1rem",
            "margin": "0 auto",
            "padding": ".5rem 2rem",
            "max-width": "100%",
            "background-color": "var(--background)",
        };

        const groupStyle = {
            "display": "flex",
            "gap": ".5rem",
            "align-items": "center",
            "justify-content": "flex-end",
            "margin": "0 .5rem",
        };

        const titleStyle = {
            "margin": "0",
            "width": "25ch",
            "text-align": "right",
        }

        const statusDotStyle = {
            "display": "block",
            "width": "0",
            "height": "0",
            "margin-left": "1rem",
            "padding": "calc(var(--status-dot-diameter)/2)",
            "border-radius": "50%",
            "cursor": "pointer",
        };

        const costInputStyle = {
            "width": "10ch",
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
            "display": "inline-block",
            "margin": "0 .5rem",
            "cursor": "pointer",
        };

        this.wrapper = document.createElement("span");
        Object.assign(this.wrapper.style, wrapperStyle);

        // links
        this.links = document.createElement("span");
        Object.apply(this.links.style, groupStyle);

        // hide link (only shown if this.visible == "true")
        this.hideLink = this.links.appendChild(document.createElement("a"));
        this.hideLink.innerHTML = "Hide";
        this.hideLink.onclick = () => this.setVisible(false);
        Object.assign(this.hideLink.style, linkStyle);

        // unhide link (only shown if this.visible == "false")
        this.unhideLink = this.links.appendChild(document.createElement("a"));
        this.unhideLink.innerHTML = "Unhide";
        this.unhideLink.onclick = () => this.setVisible(true);
        Object.assign(this.unhideLink.style, linkStyle);

        // item title & status indicator
        const itemDetails = this.wrapper.appendChild(document.createElement("span"));
        Object.assign(itemDetails.style, groupStyle);

        // item title
        const title = itemDetails.appendChild(document.createElement("p"));
        title.textContent = this.hasAttribute("title") ? this.getAttribute("title") : "";
        Object.assign(title.style, titleStyle);

        // item status indicator dot
        const statusDot = itemDetails.appendChild(document.createElement("span"));
        statusDot.onclick = (o) => this.nextStatusDotColor(o);
        Object.assign(statusDot.style, statusDotStyle);
        this.setStatusDotColor(statusDot);

        // item cost details (cost label & input)
        const costDetails = this.wrapper.appendChild(document.createElement("span"));
        Object.assign(costDetails.style, groupStyle);

        // label that displays text "Est. Repair Cost:"
        const lblRepairCost = costDetails.appendChild(
            document.createElement("p")
        );
        lblRepairCost.innerHTML = "Est. Repair Cost:";
        Object.assign(lblRepairCost.style, lblRepairCostStyle);

        // input for this.repairCost
        const repairCostInput = costDetails.appendChild(
            document.createElement("input")
        );

        repairCostInput.type = "number";
        repairCostInput.step = 10;
        repairCostInput.min = 0;
        repairCostInput.value = this.repairCost;
        repairCostInput.oninput = () => this.setRepairCost(repairCostInput);
        Object.assign(repairCostInput.style, costInputStyle);

        // maintenance notes
        const note = this.wrapper.appendChild(document.createElement("textarea"));
        note.textContent = this.innerHTML.trim();
        note.oninput = () => this.setNoteContent(note);
        Object.assign(note.style, noteStyle);

        // history link
        const history = this.links.appendChild(document.createElement("a"));
        history.innerHTML = "History";
        history.onclick = () => getHistory(this.id);
        Object.assign(history.style, linkStyle);

        // history button event
        history.onclick = () => displayHistoryPanel(this);

        this.wrapper.appendChild(this.links);
        this.setHideLink(this.visible == "true");
        this.shadowRoot.append(this.wrapper);

        // append to category if item is visible
        if (this.visible == "true") {
            this.category.appendChild(this);
        }
        else {
            hiddenItems.appendChild(this);
        }
    }

    setDisplay(value) {
        // filter items by status.
        // ignore changed items
        if (this.changed == true) return;

        // set item display value
        if (value) {
            this.wrapper.style.display = "flex";
        }
        else {
            this.wrapper.style.display = "none";
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

    setHideLink(value) {
        if (value) {
            this.links.appendChild(this.hideLink);
            this.links.removeChild(this.unhideLink);
        }
        else {
            this.links.appendChild(this.unhideLink);
            this.links.removeChild(this.hideLink);
        }
    }

    setNoteContent(textareaElement) {
        this.noteContent = textareaElement.value;
        this.changed = true;
    }

    setRepairCost(inputElement) {
        this.repairCost = inputElement.value;
        this.changed = true;
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

        this.setHideLink(value);
    }
}

function collectChanges() {
    // get all changed items and return them in Object form
    let changedItems = [];
    items.forEach((item) => {
        if (item.changed) {
            changedItems.push({
                "id": parseInt(item.id),
                "title": item.title,
                "category_id": parseInt(item.categoryID),
                "details": {
                    "status": parseInt(item.status),
                    "cost": parseInt(item.repairCost.replace(".", "")),
                    "note": item.noteContent,
                    "visible": item.visible == "true" ? true : false,
                },
            });

            // update display for all items
            item.setDisplay(item.status == filterStatus.name);
        }
    });

    return changedItems;
}

function displayAddPanel() {
    addPanel.classList.add("active");

    for (const input of addPanel.querySelectorAll("input[type=radio]")) {
        input.checked = false;
    }

    for (const fieldset of addPanel.querySelectorAll("fieldset")) {
        fieldset.disabled = true;
    }
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

function exitPanel(caller) {
    caller.parentNode.classList.remove("active");
}

function postChanges(items) {
    // send JSON data to backend via POST request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    // log response to the console
    xhr.onload = () => {
        console.log(xhr.response);
    }

    xhr.send(JSON.stringify(items));
}

function saveChanges() {
    // get changes as an array of Objects
    let changedItems = collectChanges();
    console.log(changedItems);

    // send data to backend via POST request
    postChanges(changedItems);
}

function filterItemsByStatus(type) {
    // cycle between green, yellow, and red status indicator colors
    let color = "";
    let name = filterStatus.getAttribute("name");
    let label = "Show All";

    switch (type) {
        case "0":
            color = "var(--yellow)";
            name = "1";
            label = "Warning";
            break;

        case "1":
            color = "var(--red)";
            name = "2";
            label = "Stopped";
            break;

        case "2":
            color = "";
            name = "";
            label = "Show All";
            break;

        default:
            color = "var(--green)";
            name = "0";
            label = "OK";
            break;
    }

    // update the symbol and label
    filterStatus.setAttribute("name", name);
    filterStatus.style.backgroundColor = color;
    filterCurrent.querySelector("b").innerHTML = `Filter: ${label}`;

    // update display for all items
    items.forEach((item) => {
        if (!name) {
            item.setDisplay(true);
        }
        else {
            item.setDisplay(item.status == name);
        }
    });

    // hide categories with no items after filter
    categories.forEach((category) => {
        // get list of items where status == name
        if (!name) {
            category.style.display = "";
        }

        else {
            let matchingItems = Array.from(category.querySelectorAll(`x-item[status="${name}"]`));

            // if no items match, set category display = none
            category.style.display = matchingItems.length > 0 ? "" : "none";
        }
    });
}

function formSubmit(form) {
    form_is_valid = true;

    let fields = Object.values(
        form.firstElementChild.querySelectorAll("input, select")
    ).reduce((obj, field) => {
        // parse input values into an object

        if (field.value == "-1") {
            alert("Field cannot be empty.");
            form_is_valid = false;
            return;
        }

        if (/^\d+$/.test(field.value)) {
            // if value is a number, parse as integer
            obj[field.name] = parseInt(field.value);
        } else {
            obj[field.name] = field.value;
        }

        return obj;
    }, {});

    if (!form_is_valid) {
        return;
    }

    console.log(form.action, fields);
    let xhr = new XMLHttpRequest();

    xhr.open("POST", form.action);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    // log response to the console
    xhr.onload = () => {
        console.log(xhr.response);
        window.location.reload();
    }

    xhr.send(JSON.stringify(fields));
}

function scrollToCategory(categoryID) {
    // scroll to the requested category
    document.getElementById("cat-" + categoryID).scrollIntoView();
}

function scrollToTop() {
    // scroll to the top of the page
    window.scrollTo(0, 0);
}

function toggleAddSection(selected) {
    // toggle the selected section of the add panel
    addCategory.parentNode.nextElementSibling.firstElementChild.disabled = selected != addCategory;
    addItem.parentNode.nextElementSibling.firstElementChild.disabled = selected != addItem;
}

const addPanel = document.getElementById("add-panel");
const addCategory = document.getElementById("add-category");
const addItem = document.getElementById("add-item");
const hiddenItems = document.getElementById("hidden-items");
const historyPanel = document.getElementById("history-panel");
const historyBody = document.getElementById("history-body");
const historyHeader = document.getElementById("history-header");
const filterStatus = document.getElementById("filter-status");
const filterCurrent = document.getElementById("filter-current");

const forms = document.querySelectorAll("form");
for (const form of forms) {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        formSubmit(form);
    });
}

// define custom x-item HTMLElement
const categories = Array.from(document.querySelectorAll('[id^="cat-"]'));
const items = Array.from(document.getElementsByTagName("x-item"));
window.customElements.define("x-item", Item);

// call function to save the changes
document.getElementById("link-save").onclick = saveChanges;

// hide/unhide filter-nav
document.getElementById("filter-widget").onmouseover = () => document.getElementById("filter-nav").classList.add("active");
document.getElementById("filter-widget").onmouseout = () => document.getElementById("filter-nav").classList.remove("active");
document.getElementById("filter-nav").onmouseover = () => document.getElementById("filter-nav").classList.add("active");
document.getElementById("filter-nav").onmouseout = () => document.getElementById("filter-nav").classList.remove("active");

addCategory.onclick = () => toggleAddSection(addCategory);
addItem.onclick = () => toggleAddSection(addItem);