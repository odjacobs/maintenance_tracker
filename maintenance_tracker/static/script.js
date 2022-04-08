class Item extends HTMLElement {
    /**
     * Custom HTMLElement for maintenance items.
     * 
     * Syntax:
     *     <x-item title="ITEM_NAME" **attributes> NOTE_CONTENT </x-item>
     * 
     * Attributes:
     * - title <String
     * - cost <Optional[Number]> [DEFAULT: 0.00]
     * - status <Optional[String]> [DEFAULT: "0"]
     * - statdesc <Optional[String]> [DEFAULT: ""]
     */
    constructor() {
        super();

        // required attributes
        if (!this.hasAttribute("title")) return;

        this.attachShadow({ mode: "open" });

        // attributes
        this.changed = false;
        this.repairCost = this.hasAttribute("cost") ? this.getAttribute("cost") : "0.00";
        this.statusDescription = this.hasAttribute("statdesc") ? this.getAttribute("statdesc") : "OK";
        this.status = this.hasAttribute("status") ? this.getAttribute("status") : "0";

        // constants
        this.LAST_NOTE = this.innerHTML;
        this.LAST_REPAIR_COST = this.repairCost;
        this.LAST_STATUS = this.status;
        this.LAST_STATUS_DESCRIPTION = this.statusDescription;

        // styles
        const wrapperStyle = {
            "display": "flex",
            "flex-wrap": "wrap",
            "align-items": "center",
            "justify-content": "center",
            "gap": "1rem",
            "margin": "0 auto",
            "padding": ".5rem 0",
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

        // item status details (description, cost)
        const statusDetails = wrapper.appendChild(document.createElement("span"));
        Object.assign(statusDetails.style, statusDetailsStyle);

        const statusSelect = statusDetails.appendChild(
            document.createElement("select")
        );

        // add options
        this.setStatusDescription(statusSelect, this.statusDescription);

        if (this.statusDescription != "OK") {
            let optionOk = statusSelect.appendChild(document.createElement("option"));
            optionOk.value = "OK";
            optionOk.innerHTML = "OK";
        }

        if (this.hasAttribute("options")) {
            let option_list = this.getAttribute("options").split(";");
            for (let option of option_list) {
                let o = statusSelect.appendChild(document.createElement("option"));
                o.value = option;
                o.innerHTML = option;
            }
        }

        let optionOther = statusSelect.appendChild(document.createElement("option"));
        optionOther.value = "Other";
        optionOther.innerHTML = "Other";

        statusSelect.onchange = (o) => this.setStatusDescription(statusSelect, o.target.value);
        Object.assign(statusSelect.style, statusSelectStyle);

        const lblRepairCost = statusDetails.appendChild(
            document.createElement("p")
        );
        lblRepairCost.innerHTML = "Repair Cost:";
        Object.assign(lblRepairCost.style, lblRepairCostStyle);

        const repairCostInput = statusDetails.appendChild(
            document.createElement("input")
        );
        repairCostInput.value = this.repairCost;

        // maintenance notes
        const note = wrapper.appendChild(document.createElement("textarea"));
        note.textContent = this.innerHTML.trim();
        Object.assign(note.style, noteStyle);

        this.shadowRoot.append(wrapper);
    }

    nextStatusDotColor(event) {
        let intStatus = parseInt(this.status);
        let statusDot = event.target;

        intStatus++;
        intStatus %= 3;

        this.status = `${intStatus}`;
        this.changed = true;
        this.setStatusDotColor(statusDot);
    }

    setStatusDescription(selectElement, value) {
        let optionExists = false
        for (const option of selectElement.options) {
            if (option.value == value) optionExists = true;
        }

        if (!optionExists) {
            let option = selectElement.appendChild(document.createElement("option"));
            option.value = value;
            option.innerHTML = value;
        }

        selectElement.value = value;
        this.statusDescription = selectElement.value;
        this.changed = true;
    }

    setStatusDotColor(statusDot) {
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
}

window.customElements.define("x-item", Item);
