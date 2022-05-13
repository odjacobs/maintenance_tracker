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

        this.status = this.getAttribute("status") || "0";
        this.visible = this.getAttribute("visible") || "false";

        // constants
        this.LAST_NOTE = this.innerHTML;
        this.LAST_REPAIR_COST = this.repairCost;
        this.LAST_STATUS = this.status;

        // styles
        const wrapperStyle = {
            "display": "flex",
            "align-items": "center",
            "gap": "1rem",
            "margin": "0 auto",
            "padding": ".5rem 10%",
            "width": "80%",
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

        const linkStyle = { "cursor": "pointer" };

        this.wrapper = document.createElement("span");
        Object.assign(this.wrapper.style, wrapperStyle);

        // hide link (only shown if this.visible == "true")
        this.hideLink = this.wrapper.appendChild(document.createElement("a"));
        this.hideLink.innerHTML = "Hide";
        this.hideLink.onclick = () => this.setVisible(false);
        Object.assign(this.hideLink.style, linkStyle);

        // unhide link (only shown if this.visible == "false")
        this.unhideLink = this.wrapper.appendChild(document.createElement("a"));
        this.unhideLink.innerHTML = "Unhide";
        this.unhideLink.onclick = () => this.setVisible(true);
        Object.assign(this.unhideLink.style, linkStyle);

        // item title
        const title = this.wrapper.appendChild(document.createElement("p"));
        title.textContent = this.hasAttribute("title") ? this.getAttribute("title") : "";
        Object.assign(title.style, titleStyle);

        // item status indicator dot
        const statusDot = this.wrapper.appendChild(document.createElement("span"));
        statusDot.onclick = (o) => this.nextStatusDotColor(o);
        Object.assign(statusDot.style, statusDotStyle);
        this.setStatusDotColor(statusDot);

        // item status details (description selector, cost input)
        const statusDetails = this.wrapper.appendChild(document.createElement("span"));
        Object.assign(statusDetails.style, statusDetailsStyle);

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

        repairCostInput.type = "number";
        repairCostInput.step = 1;
        repairCostInput.value = this.repairCost;
        repairCostInput.oninput = () => this.setRepairCost(repairCostInput);

        // maintenance notes
        const note = this.wrapper.appendChild(document.createElement("textarea"));
        note.textContent = this.innerHTML.trim();
        note.oninput = () => this.setNoteContent(note);
        Object.assign(note.style, noteStyle);

        // history link
        const history = this.wrapper.appendChild(document.createElement("a"));
        history.innerHTML = "History";
        history.onclick = () => getHistory(this.id);
        Object.assign(history.style, linkStyle);

        // history button event
        history.onclick = () => displayHistoryPanel(this);

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
            this.wrapper.appendChild(this.hideLink);
            this.wrapper.removeChild(this.unhideLink);
        }
        else {
            this.wrapper.appendChild(this.unhideLink);
            this.wrapper.removeChild(this.hideLink);
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

function postChanges(items) {
    // send JSON data to backend via POST request
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    // log response to the console
    xhr.onload = () => {
        console.log(xhr.response);
        alert("Successfully!");
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
        if (!name) item.setDisplay(true);
        else item.setDisplay(item.status == name);
    });

    // blank name means show all
    if (!name) return;

    // hide categories with no items after filter
    categories.forEach((category) => {
        // get list of items where status == name
        let matchingItems = Array.from(category.querySelectorAll(`x-item[status="${name}"]`));

        // if no items match, set category display = none
        category.style.display = matchingItems.length > 0 ? "" : "none";
    });
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
const filterStatus = document.getElementById("filter-status");
const filterCurrent = document.getElementById("filter-current");

// define custom x-item HTMLElement
const categories = Array.from(document.querySelectorAll('[id^="cat-"]'));
const items = Array.from(document.getElementsByTagName("x-item"));
window.customElements.define("x-item", Item);

// call function to save the changes
document.getElementById("save-changes").onclick = saveChanges;

// hide/unhide filter-nav
document.getElementById("filter-widget").onmouseover = () => document.getElementById("filter-nav").classList.add("active");
document.getElementById("filter-widget").onmouseout = () => document.getElementById("filter-nav").classList.remove("active");
document.getElementById("filter-nav").onmouseover = () => document.getElementById("filter-nav").classList.add("active");
document.getElementById("filter-nav").onmouseout = () => document.getElementById("filter-nav").classList.remove("active");