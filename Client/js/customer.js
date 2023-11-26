/* jshint esversion: 6 */
class CustomerPage {
    constructor() {
        // Constructor properties
        this.state = {
            customerId: "",
            customer: null,
            states: []
        };
        this.server = "https://localhost:44302/api";
        this.url = this.server + "/customers";
        this.$form = document.querySelector('#customerForm');
        this.$customerId = document.querySelector('#customerId');
        this.$customerName = document.querySelector('#name');
        this.$customerAddress = document.querySelector('#address');
        this.$customerCity = document.querySelector('#city');
        this.$customerState = document.querySelector('#state');
        this.$customerZipcode = document.querySelector('#zipcode');
        this.$findButton = document.querySelector('#findBtn');
        this.$addButton = document.querySelector('#addBtn');
        this.$deleteButton = document.querySelector('#deleteBtn');
        this.$editButton = document.querySelector('#editBtn');
        this.$saveButton = document.querySelector('#saveBtn');
        this.$cancelButton = document.querySelector('#cancelBtn');
        this.bindAllMethods();
        this.fetchStates();
        this.makeFieldsReadOnly(true);
        this.makeFieldsRequired(false);
        this.enableButtons("pageLoad");
    }

    // Bind methods
    bindAllMethods() {
        this.onFindCustomer = this.onFindCustomer.bind(this);
        this.onEditCustomer = this.onEditCustomer.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onDeleteCustomer = this.onDeleteCustomer.bind(this);
        this.onSaveCustomer = this.onSaveCustomer.bind(this);
        this.onAddCustomer = this.onAddCustomer.bind(this);
        this.fetchStates = this.fetchStates.bind(this);
        this.loadStates = this.loadStates.bind(this);
        this.makeFieldsReadOnly = this.makeFieldsReadOnly.bind(this);
        this.makeFieldsRequired = this.makeFieldsRequired.bind(this);
        this.fillCustomerFields = this.fillCustomerFields.bind(this);
        this.clearCustomerFields = this.clearCustomerFields.bind(this);
        this.disableButtons = this.disableButtons.bind(this);
        this.disableButton = this.disableButton.bind(this);
        this.enableButtons = this.enableButtons.bind(this);
    }

    // Fetch all states
    fetchStates() {
        // Request - GET
        fetch(`${this.server}/states`)
            .then(response => response.json())
            .then(data => {
                if (data.length == 0) alert("Can't load states. Can not add or edit customers without state information.");
                else {
                    this.state.states = data;
                    this.loadStates();
                }
            })
            .catch(e => {
                console.log(e);
                alert('❌ | GET | fetchStates() | There was a problem getting customer info!');
            });
    }

    // Create option HTML element dynamically for each given state
    loadStates() {
        let defaultOption = `<option value="" ${(!this.state.customer) ? "selected" : ""}></option>`;
        let stateHtml = this.state.states.reduce((html, state, index) => html += this.loadState(state, index), defaultOption);

        this.$customerState.innerHTML = stateHtml;
    }

    // Create option HTML element dynamically for a state
    loadState(state) {
        return `<option value=${state.stateCode} ${(this.state.customer && this.state.customer.state == state.stateCode) ? "selected" : ""}>${state.stateName}</option>`;
    }

    // Fetch customer by ID from a database
    onFindCustomer(event) {
        event.preventDefault();

        if (this.$customerId.value != "") {
            this.state.customerId = this.$customerId.value;

            // Request - GET
            fetch(`${this.url}/${this.state.customerId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status == 404) alert('That customer does not exist in our database');
                    else {
                        this.state.customer = data;
                        this.fillCustomerFields();
                        this.enableButtons("found");
                    }
                })
                .catch(e => {
                    console.log(e);
                    alert('❌ | GET | onFindCustomer() | There was a problem getting customer info!');
                });
        } else this.clearCustomerFields();
    }

    // Fetch customer by ID and attempt to delete it from a database
    onDeleteCustomer(event) {
        event.preventDefault();

        if (this.state.customerId != "") {
            // Request - DELETE
            fetch(`${this.url}/${this.state.customerId}`, { method: 'DELETE' });

            this.state.customerId = "";
            this.state.customer = null;
            this.$customerId.value = "";
            this.clearCustomerFields();
            this.enableButtons("pageLoad");

            alert("✅ Customer was successfully deleted.");
        }
    }

    // Attempt to add or update a customer from a database
    onSaveCustomer(event) {
        event.preventDefault();

        // Request - POST
        if (this.state.customerId == "") {
            fetch(`${this.url}`, {
                method: 'POST',
                body: JSON.stringify({
                    customerId: this.$customerId.value,
                    name: this.$customerName.value,
                    address: this.$customerAddress.value,
                    city: this.$customerCity.value,
                    state: this.$customerState.value,
                    zipCode: this.$customerZipcode.value,
                    invoices: [],
                    stateNavigation: null
                }),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.customerId) {
                        this.state.customerId = data.customerId;
                        this.state.customer = data;
                        this.$customerId.value = this.state.customerId;
                        this.fillCustomerFields();
                        this.$customerId.readOnly = false;
                        this.enableButtons("found");

                        alert("✅ Customer was successfully added.");
                    } else alert('❌ | POST | onSaveCustomer #1 | There was a problem adding customer info!');
                })
                .catch(e => {
                    console.log(e);
                    alert('❌ | POST | onSaveCustomer #2 | There was a problem adding customer info!');
                });
        }
        // Request - PUT
        else {
            let customer = Object.assign(this.state.customer);

            customer.name = this.$customerName.value;
            customer.address = this.$customerAddress.value;
            customer.city = this.$customerCity.value;
            customer.state = this.$customerState.value;
            customer.zipCode = this.$customerZipcode.value;

            fetch(`${this.url}/${this.state.customerId}`, {
                method: 'PUT',
                body: JSON.stringify(customer),
                headers: { 'Content-Type': 'application/json' }
            })
                .then(response => {
                    if (response.status == 204) {
                        this.state.customer = Object.assign(customer);
                        this.fillCustomerFields();
                        this.$customerId.readOnly = false;
                        this.enableButtons("found");

                        alert("✅ Customer was successfully updated.");
                    } else alert('❌ | PUT | onSaveCustomer #1 | There was a problem updating customer info!');
                })
                .catch(e => {
                    console.log(e);
                    alert('❌ | PUT | onSaveCustomer #2 | There was a problem adding customer info!');
                });
        }
    }

    // Make fields editable
    onEditCustomer(event) {
        event.preventDefault();

        this.$customerId.readOnly = true;
        this.makeFieldsReadOnly(false);
        this.makeFieldsRequired(true);
        this.enableButtons("editing");
    }

    // Clears form if new user
    onAddCustomer(event) {
        event.preventDefault();

        this.state.customerId = "";
        this.state.customer = null;
        this.$customerId.value = "";
        // this.$customerId.readOnly = true;
        this.$customerId.readOnly = false;
        this.clearCustomerFields();
        this.makeFieldsReadOnly(false);
        this.makeFieldsRequired(true);
        this.enableButtons("editing");
    }

    // Cancel editing if customer is new or already exists
    onCancel(event) {
        event.preventDefault();

        if (this.state.customerId == "") {
            this.clearCustomerFields();
            this.makeFieldsReadOnly();
            this.makeFieldsRequired(false);
            this.$customerId.readOnly = false;
            this.enableButtons("pageLoad");
        } else {
            this.fillCustomerFields();
            this.$customerId.readOnly = false;
            this.enableButtons("found");
        }
    }

    // Fill form attributes with data from customer
    fillCustomerFields() {
        this.$customerName.value = this.state.customer.name;
        this.$customerAddress.value = this.state.customer.address;
        this.$customerCity.value = this.state.customer.city;
        this.loadStates();
        this.$customerZipcode.value = this.state.customer.zipCode;
        this.makeFieldsReadOnly();
    }

    // Clears UI
    clearCustomerFields() {
        this.$customerName.value = "";
        this.$customerAddress.value = "";
        this.$customerCity.value = "";
        this.loadStates();
        this.$customerZipcode.value = "";
    }

    // Enables or disables UI elements
    makeFieldsReadOnly(readOnly = true) {
        this.$customerName.readOnly = readOnly;
        this.$customerAddress.readOnly = readOnly;
        this.$customerCity.readOnly = readOnly;
        this.$customerState.readOnly = readOnly;
        this.$customerZipcode.readOnly = readOnly;
    }

    // Make UI changes a requirement when editing
    makeFieldsRequired(required = true) {
        this.$customerName.required = required;
        this.$customerAddress.required = required;
        this.$customerCity.required = required;
        //this.$customerState.required = required;
        this.$customerZipcode.required = required;
    }

    // Disables an array of buttons
    disableButtons(buttons) {
        buttons.forEach(b => b.onclick = this.disableButton);
        buttons.forEach(b => b.classList.add("disabled"));
    }

    // Disables one button
    disableButton(event) {
        event.preventDefault();
    }

    // Activates UI elements based on the application's editing stage
    enableButtons(state) {
        switch (state) {
            case "pageLoad":
                this.disableButtons([this.$deleteButton, this.$editButton, this.$saveButton, this.$cancelButton]);
                this.$findButton.onclick = this.onFindCustomer;
                this.$findButton.classList.remove("disabled");
                this.$addButton.onclick = this.onAddCustomer;
                this.$addButton.classList.remove("disabled");
                break;
            case "editing": case "adding":
                this.disableButtons([this.$deleteButton, this.$editButton, this.$addButton]);
                this.$saveButton.onclick = this.onSaveCustomer;
                this.$cancelButton.onclick = this.onCancel;
                [this.$saveButton, this.$cancelButton].forEach(b => b.classList.remove("disabled"));
                break;
            case "found":
                this.disableButtons([this.$saveButton, this.$cancelButton]);
                this.$findButton.onclick = this.onFindCustomer;
                this.$editButton.onclick = this.onEditCustomer;
                this.$deleteButton.onclick = this.onDeleteCustomer;
                this.$addButton.onclick = this.onAddCustomer;
                [this.$findButton, this.$editButton, this.$deleteButton, this.$addButton].forEach(b => b.classList.remove("disabled"));
                break;
            default:
        }
    }
}

// Call application after the page has loaded
window.onload = () => new CustomerPage();
