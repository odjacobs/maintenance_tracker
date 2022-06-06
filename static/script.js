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
        this.note = this.innerHTML.trim() || "";

        this.repairCost = this.getAttribute("cost") || "0.00";

        this.status = this.getAttribute("status") || "0";
        this.visible = this.getAttribute("visible") || "false";
        this.removed = this.getAttribute("removed") || "false";

        // constants
        this.LAST_NOTE = this.innerHTML.trim();
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

        const optionsContainerStyle = {
            "position": "relative",
            "border-right": "solid 1px var(--font)",
            "width": "4.45rem",
            "margin-right": "150px",
            "height": "3.5rem",
        }

        const lblOptionsStyle = {
            "position": "absolute",
            "top": "1.15rem",
            "list-style-type": "none",
            "cursor": "pointer",
        }

        const optionStyle = {
            "position": "relative",
            "top": "1.1rem",
            "right": "0",
            "transform": "translate(5rem, -1.2rem)",
        }

        this.categorySelectHiddenStyle = {
            "position": "absolute",
            "top": "1.05rem",
            "left": "10rem",

            "font-size": ".7rem",
        }

        this.categorySelectStyle = {
            "position": "absolute",
            "top": "2.25rem",
            "left": "5.5rem",

            "font-size": ".7rem",
        }

        this.wrapper = document.createElement("span");
        Object.assign(this.wrapper.style, wrapperStyle);

        // links
        this.optionsContainer = document.createElement("details");
        Object.assign(this.optionsContainer.style, optionsContainerStyle);

        let lblOptions = this.optionsContainer.appendChild(document.createElement("summary"));
        lblOptions.innerText = "Options";
        Object.assign(lblOptions.style, lblOptionsStyle);

        // hide link (only shown if this.visible == "true")
        this.hideLink = this.optionsContainer.appendChild(document.createElement("a"));
        this.hideLink.innerHTML = "Hide";
        this.hideLink.onclick = () => this.setVisible(false);
        Object.assign(this.hideLink.style, linkStyle, optionStyle);

        // unhide link (only shown if this.visible == "false")
        this.unhideLink = this.optionsContainer.appendChild(document.createElement("a"));
        this.unhideLink.innerHTML = "Unhide";
        this.unhideLink.onclick = () => this.setVisible(true);
        Object.assign(this.unhideLink.style, linkStyle, optionStyle);

        // remove link (only shown if this.visible == "false")
        this.removeLink = this.optionsContainer.appendChild(document.createElement("a"));
        this.removeLink.innerHTML = "Remove";
        this.removeLink.onclick = () => this.remove();
        Object.assign(this.removeLink.style, linkStyle, optionStyle);

        this.categorySelect = this.optionsContainer.appendChild(document.createElement("select"));
        this.categorySelect.onchange = () => this.setCategory(this.categorySelect.value);

        let defaultOption = this.categorySelect.appendChild(document.createElement("option"));
        defaultOption.disabled = true;
        defaultOption.value = "-1";
        defaultOption.innerText = "Change Category";

        for (const category of categories) {
            if (category.id.slice("cat-".length) == this.categoryID) {
                continue;
            }

            let option = this.categorySelect.appendChild(document.createElement("option"));
            option.value = category.id.slice("cat-".length);
            option.innerText = category.firstElementChild.innerHTML;
        }

        Object.assign(this.categorySelect.style, this.visible == "true" ? this.categorySelectStyle : this.categorySelectHiddenStyle);

        // don't display remove link if item is visible
        if (this.visible == "true") this.optionsContainer.removeChild(this.removeLink);

        // item title & status indicator
        const itemDetails = this.wrapper.appendChild(document.createElement("span"));
        Object.assign(itemDetails.style, groupStyle);

        // item title
        const title = itemDetails.appendChild(document.createElement("p"));
        title.textContent = this.hasAttribute("title") ? this.getAttribute("title") : "";
        Object.assign(title.style, titleStyle);

        // item status indicator dot
        const statusDot = itemDetails.appendChild(document.createElement("span"));
        statusDot.classList.add("status-dot")
        statusDot.onclick = (o) => this.nextStatusDotColor(o);
        Object.assign(statusDot.style, statusDotStyle);
        this.setStatusDotColor(statusDot);

        // item cost details (cost label & input)
        const costDetails = this.wrapper.appendChild(document.createElement("span"));
        Object.assign(costDetails.style, groupStyle);

        // label that displays text "Repair Cost:"
        const lblRepairCost = costDetails.appendChild(
            document.createElement("p")
        );
        lblRepairCost.innerHTML = "Repair Cost:";
        Object.assign(lblRepairCost.style, lblRepairCostStyle);

        // input for this.repairCost
        this.repairCostInput = costDetails.appendChild(
            document.createElement("input")
        );

        this.repairCostInput.onkeydown = (e) => {
            // only allow numerical input and editing keys
            if (
                e.key.length == 1
                && /[-a-z!@#$%^&*()\[\]\\\/]/i
                    .test(e.key)
                && !e.ctrlKey
            ) e.preventDefault();
        };

        this.repairCostInput.oninput = () => {
            // set repair cost to input value and update changed status
            this.repairCost = this.repairCostInput.value;
            this.updateChanged()
        };

        this.repairCostInput.value = parseFloat(parseInt(this.repairCost) / 100).toFixed(2);
        Object.assign(this.repairCostInput.style, costInputStyle);

        // maintenance notes
        const note = this.wrapper.appendChild(document.createElement("textarea"));
        note.textContent = this.innerHTML.trim();
        note.oninput = () => this.setNoteContent(note);
        Object.assign(note.style, noteStyle);

        // history link
        const history = this.optionsContainer.appendChild(document.createElement("a"));
        history.innerHTML = "History";
        history.onclick = () => getHistory(this.id);
        Object.assign(history.style, linkStyle, optionStyle);

        // history button event
        history.onclick = () => displayHistoryPanel(this);

        this.wrapper.appendChild(this.optionsContainer);
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

    getMap() {
        try {
            return {
                "id": parseInt(this.id),
                "title": this.title,
                "category_id": parseInt(this.categoryID),
                "details": {
                    "status": parseInt(this.status),
                    "cost": parseInt(parseDollarCents(this.repairCost)),
                    "note": this.note,
                    "visible": this.visible == "true" ? true : false,
                    "removed": this.removed == "true" ? true : false,
                },
            }
        }

        catch (e) {
            alert(`Error parsing item ${this.title}: ${e}`);
            throw e;
        }
    }

    setCategory(categoryID) {
        this.categoryID = categoryID;
        postChange("update/item", this.getMap(), false);
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
        this.updateChanged();
        updateUnsavedChangesMsg();

        this.setStatusDotColor(statusDot);
    }

    remove() {
        // confirm or cancel
        if (!confirm(
            "Items will not be removed from the database, "
            + "but removed items can only be restored by a "
            + "database administrator.\n\n"
            + `Are you sure you want to remove item "${this.title}" ?`
        )) {
            return;
        }

        // set removed flag to true
        this.style.display = "none";
        postChange("delete/item", parseInt(this.id), false);
    }

    setHideLink(value) {
        if (value) {
            this.optionsContainer.appendChild(this.hideLink);
            this.optionsContainer.removeChild(this.unhideLink);
        } else {
            this.optionsContainer.appendChild(this.unhideLink);
            this.optionsContainer.removeChild(this.hideLink);
        }
    }

    setNoteContent(textareaElement) {
        this.note = textareaElement.value;
        this.updateChanged();
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

    setRemoveLink(value) {
        if (!value) {
            this.optionsContainer.appendChild(this.removeLink);
        } else {
            this.optionsContainer.removeChild(this.removeLink);
        }
    }

    setVisible(value) {
        this.visible = `${value}`;

        if (!value) {
            this.category.removeChild(this);
            hiddenItems.appendChild(this);
            Object.assign(this.categorySelect.style, this.categorySelectHiddenStyle);

            hiddenItems.style.display = "block";
        }
        else {
            hiddenItems.removeChild(this);
            this.category.appendChild(this);
            Object.assign(this.categorySelect.style, this.categorySelectStyle);
        }

        this.setHideLink(value);
        this.setRemoveLink(value);

        postChange("update/item", this.getMap(), false);
        changedItems.splice(changedItems.indexOf(this), 1);
    }

    updateChanged() {
        if (
            this.status == this.LAST_STATUS
            && this.repairCost == this.LAST_REPAIR_COST / 100
            && this.note == this.LAST_NOTE
        ) {
            this.changed = false;
            changedItems.splice(changedItems.indexOf(this), 1);
        } else {
            if (!this.changed) {
                this.changed = true;
                changedItems.push(this);
            }
        }
    }
}

function deleteCategory(category) {
    // set category to removed in database
    let categoryID = parseInt(category.id.slice("cat-".length));

    document.getElementById(`cat-${categoryID}`).style.display = "none";
    postChange("/delete/category", categoryID, false);
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

function logReload(xhr) {
    if (xhr.response != "OK") {
        alert(xhr.response);
        return;
    }

    window.location.reload();
}

function parseDollarCents(value) {
    if (value == "") return "0.00";

    let [dollars, cents] = value.split(".");

    if (!dollars && !cents) {
        throw new Error(`Invalid Price: "${value}"`);
    }

    cents = cents == undefined ? "00" : cents.padEnd(2, "0").slice(0, 2);

    return `${parseInt(dollars + cents)}`
}

function postChange(action, content, autoReload) {
    // send changes to server
    let xhr = new XMLHttpRequest();
    xhr.open("POST", action);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    // log response to the console
    xhr.onload = () => {
        if (!autoReload) {
            // check for unsaved changes
            if (changedItems.length > 0) {
                updateUnsavedChangesMsg();
            } else {
                logReload(xhr, false);
            }
        }

        else {
            logReload(xhr, false);
        }
    };

    xhr.send(JSON.stringify(content));
}

function saveChanges() {
    // send data to backend via POST request
    let changes = [];

    try {
        changes = changedItems.map((item) => item.getMap());
    }

    catch (e) {
        return;
    }

    postChange("/", changes, true);
}

function hideEmptyCategories() {
    // hide empty categories
    document.querySelectorAll(`[id^="cat-"]`).forEach((category) => {
        if (category.querySelectorAll("x-item").length == 0) {
            let category_title = category.querySelector("h2").innerHTML;
            categorySection.removeChild(category);

            let deleteCategorySpan = document.createElement("span");
            deleteCategorySpan.style.display = "flex";
            deleteCategorySpan.style.gap = "1rem";
            deleteCategorySpan.style.margin = ".25rem 0";

            let deleteCategoryText = document.createElement("p");
            deleteCategoryText.innerHTML = `${category_title}`;

            let deleteCategoryLink = document.createElement("a");
            deleteCategoryLink.innerHTML = "Delete";
            deleteCategoryLink.style.textDecoration = "underline";
            deleteCategoryLink.onclick = () => deleteCategory(category);

            deleteCategorySpan.appendChild(deleteCategoryText);

            // add delete link next to category title
            // only add if category is truly empty (no hidden items)
            let noHiddenItemsInCategory = true
            hiddenItems.querySelectorAll("x-item").forEach((item) => {
                if (item.categoryID == category.id.slice("cat-".length)) {
                    noHiddenItemsInCategory = false;
                }
            });

            if (noHiddenItemsInCategory) {
                deleteCategorySpan.appendChild(deleteCategoryLink);
            }

            emptyCategorySection.appendChild(deleteCategorySpan);

            // hide link to empty category in table of contents
            document.querySelectorAll("a.toc-link").forEach((link) => {
                if (link.innerHTML == category_title) {
                    link.style.display = "none";
                }
            });

            console.log(`[HIDING EMPTY CATEGORY: ${category_title}]`);
        }
    });
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

        // hide empty categories
    });

    hideEmptyCategories();
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

        obj["removed"] = false;

        return obj;
    }, {});

    if (!form_is_valid) {
        return;
    }

    postChange(form.action, fields, true)
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

function updateUnsavedChangesMsg() {
    if (changedItems.length > 0) {
        unsavedChangesMsg.style.display = "block";
        return;
    }

    unsavedChangesMsg.style.display = "none";
}

const addPanel = document.getElementById("add-panel");
const addCategory = document.getElementById("add-category");
const addItem = document.getElementById("add-item");
const unsavedChangesMsg = document.getElementById("unsaved-changes-msg");
const categorySection = document.getElementById("categories");
const emptyCategorySection = document.getElementById("empty-categories");
const hiddenItems = document.getElementById("hidden-items");
const historyPanel = document.getElementById("history-panel");
const historyBody = document.getElementById("history-body");
const historyHeader = document.getElementById("history-header");
const filterStatus = document.getElementById("filter-status");
const filterCurrent = document.getElementById("filter-current");
const forms = document.querySelectorAll("form");

let changedItems = [];

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

window.onload = () => {
    hideEmptyCategories()

    // reset input and select fields
    document.querySelectorAll("input").forEach((input) => { input.value = "" });
    document.querySelectorAll("select").forEach((select) => { select.value = "-1" });

    // hide hidden items section there are no hidden items or empty categories
    if (
        hiddenItems.querySelectorAll("x-item").length == 0
        && emptyCategorySection.querySelectorAll("x-category").length == 0) {
        hiddenItems.style.display = "none";
    }
};

window.addEventListener("input", (e) => {
    updateUnsavedChangesMsg();
});

window.addEventListener("click", (e) => {
    if (e.target.classList.contains("status-dot")) {
        updateUnsavedChangesMsg();
    }
});